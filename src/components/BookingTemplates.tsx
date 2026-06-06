import { useState, useEffect } from 'react';
import {
  BookmarkPlus,
  Trash2,
  Play,
  Plus,
  FileText,
  Building2,
  Users,
  User,
  Phone,
} from 'lucide-react';
import { BookingTemplate } from '../types';
import {
  getTemplatesFromStorage,
  addTemplateToStorage,
  deleteTemplateFromStorage,
} from '../utils/storage';

interface BookingTemplatesProps {
  currentFormData: {
    title: string;
    department: string;
    attendees: number;
    contact: string;
    phone: string;
  };
  onApplyTemplate: (template: BookingTemplate) => void;
}

export function BookingTemplates({ currentFormData, onApplyTemplate }: BookingTemplatesProps) {
  const [templates, setTemplates] = useState<BookingTemplate[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    const data = getTemplatesFromStorage();
    setTemplates(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  };

  const handleAddTemplate = () => {
    if (!templateName.trim()) {
      setError('请输入模板名称');
      return;
    }
    if (!currentFormData.title.trim()) {
      setError('会议主题不能为空');
      return;
    }
    if (!currentFormData.department.trim()) {
      setError('使用科室不能为空');
      return;
    }
    if (!currentFormData.contact.trim()) {
      setError('联系人不能为空');
      return;
    }

    addTemplateToStorage({
      name: templateName.trim(),
      title: currentFormData.title,
      department: currentFormData.department,
      attendees: currentFormData.attendees,
      contact: currentFormData.contact,
      phone: currentFormData.phone,
    });

    setTemplateName('');
    setIsAdding(false);
    setError('');
    loadTemplates();
  };

  const handleDeleteTemplate = (id: string) => {
    deleteTemplateFromStorage(id);
    loadTemplates();
  };

  const handleApplyTemplate = (template: BookingTemplate) => {
    onApplyTemplate(template);
  };

  return (
    <div className="w-80 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <div className="w-1 h-5 bg-amber-500 rounded-full"></div>
            常用模板
          </h2>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
              title="保存当前表单为模板"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {isAdding && (
        <div className="px-6 pb-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <BookmarkPlus className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">保存为模板</span>
            </div>
            <input
              type="text"
              value={templateName}
              onChange={(e) => {
                setTemplateName(e.target.value);
                setError('');
              }}
              placeholder="请输入模板名称"
              className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent mb-2"
              autoFocus
            />
            {error && (
              <p className="text-xs text-red-600 mb-2">{error}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleAddTemplate}
                className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                保存
              </button>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setTemplateName('');
                  setError('');
                }}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium rounded-lg transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {templates.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <BookmarkPlus className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">暂无模板</p>
            <p className="text-xs mt-1">点击 + 保存常用预定信息</p>
          </div>
        ) : (
          <div className="space-y-2">
            {templates.map((template) => (
              <div
                key={template.id}
                className="p-3 border border-slate-200 rounded-lg hover:border-amber-300 hover:bg-amber-50/30 transition-all group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-medium text-slate-800">{template.name}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                    title="删除模板"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-1 text-xs text-slate-500 mb-3">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-3 h-3 text-slate-300" />
                    <span className="truncate">{template.title || '-'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3 h-3 text-slate-300" />
                    <span className="truncate">{template.department || '-'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3 h-3 text-slate-300" />
                    <span>{template.attendees} 人</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User className="w-3 h-3 text-slate-300" />
                    <span className="truncate">{template.contact || '-'}</span>
                  </div>
                  {template.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-slate-300" />
                      <span className="truncate">{template.phone}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleApplyTemplate(template)}
                  className="w-full py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <Play className="w-3 h-3" />
                  应用模板
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
