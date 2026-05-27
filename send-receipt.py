#!/usr/bin/env python3
import sys
import serial
import time
import os
import fcntl

DEVICE = "/dev/cu.RPP02N"
BAUD = 9600
LOCK_FILE = "/tmp/rpp02n_print.lock"
LOG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "storage/logs/receipts/bluetooth_send.log")

def log_msg(msg: str):
    with open(LOG_FILE, "a") as f:
        f.write(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {msg}\n")

def acquire_lock() -> bool:
    try:
        fd = os.open(LOCK_FILE, os.O_CREAT | os.O_RDWR, 0o644)
        fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
        return fd
    except (IOError, OSError):
        return None

def release_lock(fd):
    if fd:
        fcntl.flock(fd, fcntl.LOCK_UN)
        os.close(fd)

def send(filepath: str) -> bool:
    if not os.path.exists(filepath):
        log_msg(f"File not found: {filepath}")
        print("File not found:", filepath)
        return False

    fd = acquire_lock()
    if not fd:
        log_msg("Another print in progress, queued")
        fd = acquire_lock()
        if not fd:
            log_msg("Timeout waiting for lock")
            return False

    try:
        with open(filepath, "rb") as f:
            data = f.read()

        ser = serial.Serial(DEVICE, BAUD, timeout=10)
        time.sleep(1)
        ser.write(data)
        ser.flush()
        time.sleep(1)
        ser.close()
        log_msg(f"Sent {len(data)} bytes")
        print(f"Sent {len(data)} bytes to {DEVICE}")
        return True
    except Exception as e:
        log_msg(f"Error: {e}")
        print(f"Error: {e}")
        return False
    finally:
        release_lock(fd)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: send-receipt.py <file.bin>")
        sys.exit(1)

    success = send(sys.argv[1])
    sys.exit(0 if success else 1)
