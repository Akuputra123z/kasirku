"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  rowSelection?: Record<string, boolean>
  onRowSelectionChange?: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  hidePaginationControls?: boolean
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  rowSelection: externalRowSelection,
  onRowSelectionChange: externalOnRowSelectionChange,
  hidePaginationControls,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [internalRowSelection, setInternalRowSelection] = React.useState({})

  const isControlled = externalRowSelection !== undefined && externalOnRowSelectionChange !== undefined
  const rowSelection = isControlled ? externalRowSelection : internalRowSelection
  const setRowSelection = isControlled ? externalOnRowSelectionChange : setInternalRowSelection

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    ...(hidePaginationControls ? {} : { getPaginationRowModel: getPaginationRowModel() }),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-b border-neutral-100 dark:border-neutral-900 bg-neutral-50/50 dark:bg-neutral-900/20">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="font-semibold text-foreground text-[13px] py-3.5">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="group hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors border-b border-neutral-100 dark:border-neutral-900"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3.5">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {!hidePaginationControls && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
          <div className="flex items-center gap-2">
              <Select
                  value={`${table.getState().pagination.pageSize}`}
                  onValueChange={(value) => {
                      table.setPageSize(Number(value))
                  }}
              >
                  <SelectTrigger className="w-[75px] h-9 border-neutral-200 dark:border-neutral-800 bg-transparent rounded-lg text-[13px]">
                      <SelectValue placeholder={table.getState().pagination.pageSize} />
                  </SelectTrigger>
                  <SelectContent side="top" className="border-neutral-200 dark:border-neutral-800 rounded-xl">
                      {[10, 20, 30, 40, 50].map((pageSize) => (
                          <SelectItem key={pageSize} value={`${pageSize}`}>
                              {pageSize}
                          </SelectItem>
                      ))}
                  </SelectContent>
              </Select>
              <span className="text-[13px] text-muted-foreground font-medium ml-2 text-neutral-900 dark:text-white">Items per page</span>
          </div>

          <div className="flex items-center gap-6">
              <span className="text-[13px] font-semibold text-foreground text-neutral-900 dark:text-white">
                  Page {table.getState().pagination.pageIndex + 1} of{" "}
                  {table.getPageCount()}
              </span>
              <div className="flex items-center gap-1.5">
                  <Button
                      variant="outline"
                      className="size-8 p-0 rounded-lg border-neutral-200 dark:border-neutral-800 bg-transparent disabled:opacity-40"
                      onClick={() => table.setPageIndex(0)}
                      disabled={!table.getCanPreviousPage()}
                  >
                      <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                      variant="outline"
                      className="size-8 p-0 rounded-lg border-neutral-200 dark:border-neutral-800 bg-transparent disabled:opacity-40"
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                  >
                      <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                      variant="outline"
                      className="size-8 p-0 rounded-lg border-neutral-200 dark:border-neutral-800 bg-transparent disabled:opacity-40"
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                  >
                      <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                      variant="outline"
                      className="size-8 p-0 rounded-lg border-neutral-200 dark:border-neutral-800 bg-transparent disabled:opacity-40"
                      onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                      disabled={!table.getCanNextPage()}
                  >
                      <ChevronsRight className="h-4 w-4" />
                  </Button>
              </div>
          </div>
        </div>
      )}
    </div>
  )
}
