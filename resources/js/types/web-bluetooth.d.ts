interface BluetoothDevice {
    gatt?: BluetoothRemoteGATTServer;
}

interface BluetoothRemoteGATTServer {
    connect(): Promise<BluetoothRemoteGATTServer>;
    disconnect(): void;
    getPrimaryService(service: string): Promise<BluetoothRemoteGATTService>;
}

interface BluetoothRemoteGATTService {
    getCharacteristic(
        characteristic: string,
    ): Promise<BluetoothRemoteGATTCharacteristic>;
}

interface BluetoothRemoteGATTCharacteristic {
    writeValue(value: Uint8Array): Promise<void>;
}

interface Navigator {
    bluetooth?: {
        requestDevice(options: {
            filters?: Array<{
                services: string[];
                name?: string;
                namePrefix?: string;
            }>;
            acceptAllDevices?: boolean;
            optionalServices?: string[];
        }): Promise<BluetoothDevice>;
    };
}
