/**
 * @jest-environment jsdom
 */
import { exportToCSV, type CSVColumn } from "../../utils/csvExport";

// Helper to read Blob as ArrayBuffer to preserve BOM bytes
function readBlobBytes(blob: Blob): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  });
}

// Helper to read Blob as text (BOM may be stripped by readAsText)
function readBlob(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(blob);
  });
}

describe("exportToCSV", () => {
  let createObjectURLMock: jest.Mock;
  let revokeObjectURLMock: jest.Mock;
  let appendChildMock: jest.SpyInstance;
  let removeChildMock: jest.SpyInstance;
  let clickMock: jest.Mock;
  let capturedBlob: Blob | null = null;

  beforeEach(() => {
    capturedBlob = null;
    clickMock = jest.fn();
    createObjectURLMock = jest.fn(() => "blob:mock-url");
    revokeObjectURLMock = jest.fn();
    Object.defineProperty(globalThis, "URL", {
      value: { createObjectURL: (blob: Blob) => { capturedBlob = blob; return createObjectURLMock(blob); }, revokeObjectURL: revokeObjectURLMock },
      writable: true,
    });
    appendChildMock = jest.spyOn(document.body, "appendChild").mockImplementation((node) => node);
    removeChildMock = jest.spyOn(document.body, "removeChild").mockImplementation((node) => node);
    jest.spyOn(document, "createElement").mockReturnValue({
      set href(v: string) { /* noop */ },
      set download(v: string) { /* noop */ },
      click: clickMock,
    } as unknown as HTMLElement);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should generate CSV with BOM and proper headers", async () => {
    const data = [{ name: "Alice", age: 30 }];
    const columns: CSVColumn<{ name: string; age: number }>[] = [
      { header: "Name", accessor: (r) => r.name },
      { header: "Age", accessor: (r) => r.age },
    ];

    exportToCSV(data, columns, "test.csv");

    expect(clickMock).toHaveBeenCalled();
    expect(appendChildMock).toHaveBeenCalled();
    expect(removeChildMock).toHaveBeenCalled();
    expect(revokeObjectURLMock).toHaveBeenCalled();

    // Check blob content
    expect(capturedBlob).not.toBeNull();
    // Verify BOM bytes (EF BB BF)
    const bytes = await readBlobBytes(capturedBlob!);
    expect(bytes[0]).toBe(0xEF);
    expect(bytes[1]).toBe(0xBB);
    expect(bytes[2]).toBe(0xBF);
    // Verify CSV content (readAsText may strip BOM)
    const text = await readBlob(capturedBlob!);
    expect(text).toContain("Name,Age");
    expect(text).toContain("Alice,30");
  });

  it("should escape commas and quotes", async () => {
    const data = [{ val: 'has, comma' }, { val: 'has "quotes"' }];
    const columns: CSVColumn<{ val: string }>[] = [
      { header: "Value", accessor: (r) => r.val },
    ];

    exportToCSV(data, columns, "escape-test");

    const text = await readBlob(capturedBlob!);
    expect(text).toContain('"has, comma"');
    expect(text).toContain('"has ""quotes"""');
  });

  it("should handle null and undefined values", async () => {
    const data = [{ a: null as string | null, b: undefined as string | undefined }];
    const columns: CSVColumn<{ a: string | null; b: string | undefined }>[] = [
      { header: "A", accessor: (r) => r.a },
      { header: "B", accessor: (r) => r.b },
    ];

    exportToCSV(data, columns, "null-test.csv");

    const text = await readBlob(capturedBlob!);
    expect(text).toContain("A,B");
  });

  it("should handle empty data array", async () => {
    const columns: CSVColumn<Record<string, never>>[] = [
      { header: "Col1", accessor: () => "" },
    ];

    exportToCSV([], columns, "empty.csv");

    const text = await readBlob(capturedBlob!);
    expect(text).toContain("Col1");
  });

  it("should append .csv extension if missing", () => {
    const mockLink = {
      href: "",
      download: "",
      click: clickMock,
    };
    (document.createElement as jest.Mock).mockReturnValue(mockLink);

    exportToCSV([], [{ header: "X", accessor: () => "" }], "noext");
    expect(mockLink.download).toBe("noext.csv");
  });
});
