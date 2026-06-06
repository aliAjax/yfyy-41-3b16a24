import { useState, useMemo } from 'react';
import {
  X,
  Upload,
  CheckCircle,
  AlertCircle,
  FileText,
  Copy,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  RefreshCw,
  Edit3,
} from 'lucide-react';
import { useBookingStore } from '../store/useBookingStore';
import {
  parseCSV,
  validateParsedRows,
  ParsedBookingRow,
  ValidationErrorType,
  generateSampleCSV,
  revalidateSingleRow,
  revalidateAllRows,
} from '../utils/importUtils';

interface EditingCell {
  rowIndex: number;
  field: string;
}


const errorTypeConfig: Record<ValidationErrorType, { label: string; color: string; bgColor: string }> = {
  missing_field: { label: '缺字段', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  invalid_format: { label: '格式无效', color: 'text-red-700', bgColor: 'bg-red-100' },
  room_not_found: { label: '会议室不存在', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  capacity_exceeded: { label: '容量超限', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  time_conflict: { label: '时间冲突', color: 'text-rose-700', bgColor: 'bg-rose-100' },
};

export function BatchImportModal() {
  const { isBatchImportModalOpen, setIsBatchImportModalOpen, bookings, batchAddBookings, getActiveRooms } =
    useBookingStore();
  const [csvText, setCsvText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedBookingRow[]>([]);
  const [hasParsed, setHasParsed] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState('');

  const stats = useMemo(() => {
    const total = parsedRows.length;
    const valid = parsedRows.filter((r) => r.isValid).length;
    const invalid = total - valid;

    const errorCounts: Record<ValidationErrorType, number> = {
      missing_field: 0,
      invalid_format: 0,
      room_not_found: 0,
      capacity_exceeded: 0,
      time_conflict: 0,
    };

    parsedRows.forEach((row) => {
      row.errors.forEach((err) => {
        errorCounts[err.type]++;
      });
    });

    return { total, valid, invalid, errorCounts };
  }, [parsedRows]);

  const handleClose = () => {
    setIsBatchImportModalOpen(false);
    setCsvText('');
    setParsedRows([]);
    setHasParsed(false);
    setImportResult(null);
    setIsImporting(false);
  };

  const handleParse = () => {
    if (!csvText.trim()) {
      setImportResult({ success: false, message: '请输入CSV数据' });
      return;
    }

    try {
      const rows = parseCSV(csvText);
      if (rows.length === 0) {
        setImportResult({ success: false, message: '未解析到有效数据行' });
        setParsedRows([]);
        setHasParsed(false);
        return;
      }

      const activeRooms = getActiveRooms();
      const validatedRows = validateParsedRows(rows, activeRooms, bookings);
      setParsedRows(validatedRows);
      setHasParsed(true);
      setImportResult(null);
    } catch (parseError) {
      console.error('CSV解析错误:', parseError);
      setImportResult({ success: false, message: 'CSV解析失败，请检查格式' });
      setParsedRows([]);
      setHasParsed(false);
    }
  };

  const handleImport = () => {
    if (!hasParsed || stats.invalid > 0) return;

    setIsImporting(true);

    setTimeout(() => {
      const result = batchAddBookings(parsedRows);
      setImportResult({
        success: result.success,
        message: result.message,
      });

      if (result.success) {
        setTimeout(() => {
          handleClose();
        }, 1500);
      }

      setIsImporting(false);
    }, 500);
  };

  const handleCopySample = () => {
    navigator.clipboard.writeText(generateSampleCSV());
  };

  const handleDownloadSample = () => {
    const csv = generateSampleCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '预定导入示例.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCellClick = (rowIndex: number, field: string, currentValue: string) => {
    setEditingCell({ rowIndex, field });
    setEditValue(currentValue);
    setImportResult(null);
  };

  const updateRelatedRowsConflicts = (
    targetRowIndex: number,
    revalidatedRow: ParsedBookingRow,
    allRows: ParsedBookingRow[]
  ): ParsedBookingRow[] => {
    return allRows.map((row) => {
      if (row.rowIndex === targetRowIndex) {
        return revalidatedRow;
      }

      const hasOldConflict = row.errors.some(
        (e) => e.type === 'time_conflict' && e.message.includes(`第${targetRowIndex}行`)
      );

      if (!revalidatedRow.formData) {
        if (hasOldConflict) {
          const newErrors = row.errors.filter(
            (e) => !(e.type === 'time_conflict' && e.message.includes(`第${targetRowIndex}行`))
          );
          const newIsValid = newErrors.length === 0;

          return {
            ...row,
            errors: newErrors,
            isValid: newIsValid,
          };
        }
        return row;
      }

      if (!row.formData) {
        if (hasOldConflict) {
          const newErrors = row.errors.filter(
            (e) => !(e.type === 'time_conflict' && e.message.includes(`第${targetRowIndex}行`))
          );
          return {
            ...row,
            errors: newErrors,
          };
        }
        return row;
      }

      if (row.formData.roomId !== revalidatedRow.formData.roomId) {
        if (hasOldConflict) {
          const newErrors = row.errors.filter(
            (e) => !(e.type === 'time_conflict' && e.message.includes(`第${targetRowIndex}行`))
          );
          const newIsValid = newErrors.length === 0;
          return {
            ...row,
            errors: newErrors,
            isValid: newIsValid,
          };
        }
        return row;
      }

      const rowStart = new Date(row.formData.startTime);
      const rowEnd = new Date(row.formData.endTime);
      const revalidStart = new Date(revalidatedRow.formData.startTime);
      const revalidEnd = new Date(revalidatedRow.formData.endTime);

      const hasTimeConflict = rowStart < revalidEnd && rowEnd > revalidStart;

      if (!hasTimeConflict) {
        if (hasOldConflict) {
          const newErrors = row.errors.filter(
            (e) => !(e.type === 'time_conflict' && e.message.includes(`第${targetRowIndex}行`))
          );
          const newIsValid = newErrors.length === 0;
          return {
            ...row,
            errors: newErrors,
            isValid: newIsValid,
          };
        }
        return row;
      }

      if (!hasOldConflict) {
        return {
          ...row,
          errors: [
            ...row.errors,
            {
              type: 'time_conflict' as ValidationErrorType,
              field: '时间',
              message: `与第${targetRowIndex}行时间冲突（同一会议室）`,
            },
          ],
          isValid: false,
        };
      }

      return row;
    });
  };

  const handleCellBlur = () => {
    if (!editingCell) return;

    const updatedRows = parsedRows.map((row) => {
      if (row.rowIndex === editingCell.rowIndex) {
        return {
          ...row,
          rawData: {
            ...row.rawData,
            [editingCell.field]: editValue.trim(),
          },
        };
      }
      return row;
    });

    const targetRow = updatedRows.find((r) => r.rowIndex === editingCell.rowIndex);
    if (targetRow) {
      const activeRooms = getActiveRooms();
      const revalidated = revalidateSingleRow(targetRow, updatedRows, activeRooms, bookings);
      const finalRows = updateRelatedRowsConflicts(
        editingCell.rowIndex,
        revalidated,
        updatedRows
      );
      setParsedRows(finalRows);
    } else {
      setParsedRows(updatedRows);
    }

    setEditingCell(null);
    setImportResult(null);
  };

  const handleCellKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCellBlur();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const handleRevalidateRow = (rowIndex: number) => {
    const targetRow = parsedRows.find((r) => r.rowIndex === rowIndex);
    if (!targetRow) return;

    const activeRooms = getActiveRooms();
    const revalidated = revalidateSingleRow(targetRow, parsedRows, activeRooms, bookings);
    const newRows = updateRelatedRowsConflicts(rowIndex, revalidated, parsedRows);

    setParsedRows(newRows);
    setImportResult(null);
  };

  const handleRevalidateAll = () => {
    const activeRooms = getActiveRooms();
    const revalidatedRows = revalidateAllRows(parsedRows, activeRooms, bookings);
    setParsedRows(revalidatedRows);
    setImportResult(null);
  };

  if (!isBatchImportModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden animate-[fadeIn_0.2s_ease-out]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Upload className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">批量导入预定</h2>
              <p className="text-xs text-slate-500">粘贴CSV格式数据，批量创建会议预定</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors text-slate-500 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {importResult && (
            <div
              className={`p-4 rounded-xl flex items-center gap-3 ${
                importResult.success
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              {importResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              )}
              <span
                className={`text-sm font-medium ${
                  importResult.success ? 'text-green-700' : 'text-red-700'
                }`}
              >
                {importResult.message}
              </span>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" />
                CSV 数据
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopySample}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  复制示例
                </button>
                <button
                  onClick={handleDownloadSample}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  下载示例
                </button>
              </div>
            </div>

            <textarea
              value={csvText}
              onChange={(e) => {
                setCsvText(e.target.value);
                setHasParsed(false);
                setParsedRows([]);
                setImportResult(null);
              }}
              placeholder={`请粘贴CSV格式数据，第一行为表头。支持字段：
会议室名称,会议主题,使用科室,参会人数,日期,开始时间,结束时间,联系人,联系电话,备注

示例：
大会议室,季度总结会,综合办公室,30,2026-06-10,09:00,11:00,张三,13800138000,季度工作总结`}
              className="w-full h-40 px-4 py-3 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
            />

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Info className="w-3.5 h-3.5" />
              <span>
                必填字段：会议室名称、会议主题、使用科室、参会人数、日期、开始时间、结束时间、联系人
              </span>
            </div>

            <button
              onClick={handleParse}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              <FileText className="w-4 h-4" />
              解析并预览
            </button>
          </div>

          {hasParsed && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700">校验结果预览</h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleRevalidateAll}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    重新校验全部
                  </button>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1 text-slate-600">
                      共 <span className="font-semibold text-slate-800">{stats.total}</span> 行
                    </span>
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      通过 <span className="font-semibold">{stats.valid}</span> 行
                    </span>
                    <span className="flex items-center gap-1 text-red-600">
                      <XCircle className="w-3.5 h-3.5" />
                      失败 <span className="font-semibold">{stats.invalid}</span> 行
                    </span>
                  </div>
                </div>
              </div>

              {stats.invalid > 0 && (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(stats.errorCounts).map(([type, count]) => {
                    if (count === 0) return null;
                    const config = errorTypeConfig[type as ValidationErrorType];
                    return (
                      <span
                        key={type}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}
                      >
                        <AlertTriangle className="w-3 h-3" />
                        {config.label}：{count} 条
                      </span>
                    );
                  })}
                </div>
              )}

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-80 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr className="border-b border-slate-200">
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 w-12">
                          行号
                        </th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">
                          会议室
                        </th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">
                          会议主题
                        </th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">
                          科室
                        </th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 w-16">
                          人数
                        </th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">
                          日期
                        </th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 w-32">
                          开始时间
                        </th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 w-32">
                          结束时间
                        </th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600">
                          联系人
                        </th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 w-28">
                          状态
                        </th>
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 w-24">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedRows.map((row) => {
                        const isEditingThisRow = editingCell?.rowIndex === row.rowIndex;

                        const renderEditableCell = (
                          field: string,
                          hasError: boolean,
                          textColorClass: string
                        ) => {
                          const value = row.rawData[field] || '';
                          const isEditing = isEditingThisRow && editingCell?.field === field;

                          if (isEditing) {
                            return (
                              <input
                                autoFocus
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={handleCellBlur}
                                onKeyDown={handleCellKeyDown}
                                className="w-full px-2 py-1 text-sm border-2 border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                              />
                            );
                          }

                          return (
                            <div
                              className={`flex items-center gap-1 cursor-pointer group min-h-[24px] ${
                                hasError ? 'text-red-600' : textColorClass
                              }`}
                              onClick={() => handleCellClick(row.rowIndex, field, value)}
                            >
                              <span className="flex-1">
                                {value || '-'}
                              </span>
                              <Edit3 className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity flex-shrink-0" />
                            </div>
                          );
                        };

                        return (
                          <tr
                            key={row.rowIndex}
                            className={`${
                              row.isValid
                                ? 'hover:bg-green-50/50'
                                : 'bg-red-50/30 hover:bg-red-50/60'
                            } transition-colors`}
                          >
                            <td className="px-3 py-2.5 text-slate-500 font-mono text-xs">
                              {row.rowIndex}
                            </td>
                            <td className="px-3 py-2.5">
                              {renderEditableCell(
                                '会议室名称',
                                row.errors.some((e) => e.type === 'room_not_found'),
                                'text-slate-700'
                              )}
                            </td>
                            <td className="px-3 py-2.5">
                              {renderEditableCell(
                                '会议主题',
                                row.errors.some(
                                  (e) =>
                                    e.type === 'missing_field' && e.field === '会议主题'
                                ),
                                'text-slate-700'
                              )}
                            </td>
                            <td className="px-3 py-2.5">
                              {renderEditableCell(
                                '使用科室',
                                row.errors.some(
                                  (e) =>
                                    e.type === 'missing_field' && e.field === '使用科室'
                                ),
                                'text-slate-600'
                              )}
                            </td>
                            <td className="px-3 py-2.5">
                              {renderEditableCell(
                                '参会人数',
                                row.errors.some(
                                  (e) =>
                                    e.type === 'capacity_exceeded' ||
                                    (e.type === 'missing_field' && e.field === '参会人数') ||
                                    (e.type === 'invalid_format' && e.field === '参会人数')
                                ),
                                'text-slate-700'
                              )}
                            </td>
                            <td className="px-3 py-2.5">
                              {renderEditableCell(
                                '日期',
                                row.errors.some(
                                  (e) =>
                                    e.type === 'invalid_format' && e.field === '日期'
                                ),
                                'text-slate-600'
                              )}
                            </td>
                            <td className="px-3 py-2.5">
                              {renderEditableCell(
                                '开始时间',
                                row.errors.some(
                                  (e) =>
                                    (e.type === 'invalid_format' && e.field === '开始时间') ||
                                    e.type === 'time_conflict'
                                ),
                                'text-slate-600'
                              )}
                            </td>
                            <td className="px-3 py-2.5">
                              {renderEditableCell(
                                '结束时间',
                                row.errors.some(
                                  (e) =>
                                    (e.type === 'invalid_format' && e.field === '结束时间') ||
                                    e.type === 'time_conflict'
                                ),
                                'text-slate-600'
                              )}
                            </td>
                            <td className="px-3 py-2.5">
                              {renderEditableCell(
                                '联系人',
                                row.errors.some(
                                  (e) =>
                                    e.type === 'missing_field' && e.field === '联系人'
                                ),
                                'text-slate-600'
                              )}
                            </td>
                            <td className="px-3 py-2.5">
                              {row.isValid ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                                  <CheckCircle2 className="w-3 h-3" />
                                  通过
                                </span>
                              ) : (
                                <div className="space-y-1">
                                  {row.errors.slice(0, 2).map((err, idx) => {
                                    const config = errorTypeConfig[err.type];
                                    return (
                                      <div
                                        key={idx}
                                        className={`text-xs px-1.5 py-0.5 rounded ${config.bgColor} ${config.color}`}
                                        title={err.message}
                                      >
                                        {config.label}
                                      </div>
                                    );
                                  })}
                                  {row.errors.length > 2 && (
                                    <span className="text-xs text-slate-500">
                                      +{row.errors.length - 2} 更多
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-2.5">
                              <button
                                onClick={() => handleRevalidateRow(row.rowIndex)}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                title="重新校验本行"
                              >
                                <RefreshCw className="w-3 h-3" />
                                校验
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {stats.invalid > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-800 mb-2">
                        存在 {stats.invalid} 条校验不通过的数据，请修正后再导入
                      </p>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {parsedRows
                          .filter((r) => !r.isValid)
                          .slice(0, 5)
                          .map((row) => (
                            <div
                              key={row.rowIndex}
                              className="text-xs text-amber-700 flex gap-2"
                            >
                              <span className="font-mono">第{row.rowIndex}行：</span>
                              <span>{row.errors.map((e) => e.message).join('；')}</span>
                            </div>
                          ))}
                        {stats.invalid > 5 && (
                          <p className="text-xs text-amber-600">
                            ...还有 {stats.invalid - 5} 条错误
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <Info className="w-4 h-4 text-slate-400" />
              支持的会议室
            </h4>
            <div className="flex flex-wrap gap-2">
              {getActiveRooms().map((room) => (
                <span
                  key={room.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-600"
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: room.color }}
                  />
                  {room.name}（{room.capacity}人）
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 flex-shrink-0 bg-slate-50">
          <div className="text-xs text-slate-500">
            兼容单条新建预定逻辑，数据统一存储在本地
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleImport}
              disabled={!hasParsed || stats.invalid > 0 || isImporting}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg disabled:shadow-none"
            >
              {isImporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  导入中...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  确认导入 ({stats.valid}条)
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
