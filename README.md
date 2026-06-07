# 会议室预订系统

一款面向单位内部的单机版会议室预订管理工具，基于浏览器 localStorage 存储数据，无需后端服务。

## 核心功能

- **日历视图**：支持日视图 / 周视图切换，以时间轴形式可视化展示会议室占用情况
- **预订管理**：创建、查看、取消会议预订，支持循环预订（每日 / 每周 / 每月）
- **冲突检测**：提交预订时自动检测时间冲突，避免重复占用
- **会议室管理**：新增、编辑、启用 / 停用会议室，配置容量、位置、设施等
- **智能推荐**：根据参会人数和时间段推荐最合适的会议室，提供临近时段建议
- **预订模板**：保存常用预订信息为模板，快速复用
- **视图保存**：保存当前查看的会议室、视图模式、日期等为快捷视图
- **批量导入导出**：支持 CSV 格式批量导入预订数据，支持导出预订记录
- **变更日志**：记录预订和会议室的所有变更历史，可追溯
- **今日概览**：展示今日会议总数、进行中会议、即将开始会议、各会议室状态
- **会议室排行**：按使用频次统计会议室使用率排行
- **响应式设计**：适配桌面端、平板和移动端

## 技术栈

- **框架**：React 18 + TypeScript
- **构建工具**：Vite 6
- **样式方案**：Tailwind CSS 3
- **状态管理**：Zustand 5
- **路由**：React Router 7
- **日期处理**：date-fns
- **图标**：lucide-react
- **工具库**：clsx + tailwind-merge
- **代码检查**：ESLint + typescript-eslint
- **单元测试**：Vitest

## 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

启动后访问 `http://localhost:5173` 即可使用。

### 生产构建

```bash
npm run build
```

构建产物输出到 `dist` 目录。

### 预览生产构建

```bash
npm run preview
```

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（热更新） |
| `npm run build` | 类型检查 + 生产构建 |
| `npm run preview` | 预览构建产物 |
| `npm run lint` | 运行 ESLint 代码检查 |
| `npm run check` | TypeScript 类型检查（不生成产物） |
| `npm run test` | 运行单元测试 |
| `npm run test:watch` | 以 watch 模式运行单元测试 |
| `npm run verify` | 本地交付验证：类型检查 → Lint → 构建 → 测试 |

## 目录结构

```
yfyy-41/
├── public/               # 静态资源
├── src/
│   ├── assets/           # 图片等资源文件
│   ├── components/       # React 组件
│   │   ├── BatchImportModal.tsx       # 批量导入弹窗
│   │   ├── BookingCard.tsx            # 预订卡片
│   │   ├── BookingDetailModal.tsx     # 预订详情弹窗
│   │   ├── BookingForm.tsx            # 预订表单
│   │   ├── CalendarView.tsx           # 日历视图容器
│   │   ├── DayView.tsx                # 日视图
│   │   ├── WeekView.tsx               # 周视图
│   │   ├── DepartmentFilter.tsx       # 部门筛选
│   │   ├── Empty.tsx                  # 空状态组件
│   │   ├── ExportButton.tsx           # 导出按钮
│   │   ├── Header.tsx                 # 顶部导航栏
│   │   ├── LeftDrawer.tsx             # 左侧抽屉（移动端）
│   │   ├── RightDrawer.tsx            # 右侧抽屉（移动端）
│   │   ├── RightPanel.tsx             # 右侧面板（桌面端）
│   │   ├── RoomFinder.tsx             # 会议室查找器
│   │   ├── RoomList.tsx               # 会议室列表
│   │   ├── RoomManagementModal.tsx    # 会议室管理弹窗
│   │   ├── RoomRanking.tsx            # 会议室排行
│   │   ├── SaveViewModal.tsx          # 保存视图弹窗
│   │   ├── TodayOverview.tsx          # 今日概览
│   │   ├── ViewSelector.tsx           # 视图选择器
│   │   └── MobileActionBar.tsx        # 移动端操作栏
│   ├── constants/        # 常量定义
│   │   └── index.ts                  # 默认会议室、存储键、业务参数
│   ├── hooks/            # 自定义 Hooks
│   │   └── useTheme.ts               # 主题切换 Hook
│   ├── lib/              # 通用库函数
│   │   └── utils.ts                  # cn() 等工具函数
│   ├── pages/            # 页面组件
│   │   └── Home.tsx                  # 主页
│   ├── store/            # 状态管理（Zustand）
│   │   └── useBookingStore.ts        # 预订全局状态
│   ├── types/            # TypeScript 类型定义
│   │   └── index.ts
│   ├── utils/            # 业务工具函数
│   │   ├── storage.ts                # localStorage 读写封装
│   │   ├── dateUtils.ts              # 日期处理
│   │   ├── recurrenceUtils.ts        # 循环预订计算
│   │   ├── exportUtils.ts            # 导出功能
│   │   ├── importUtils.ts            # 导入功能
│   │   ├── overviewUtils.ts          # 今日概览计算
│   │   ├── roomStatsUtils.ts         # 会议室统计
│   │   ├── changeLogUtils.ts         # 变更日志
│   │   └── __tests__/                # 单元测试
│   ├── App.tsx           # 应用根组件
│   ├── main.tsx          # 应用入口
│   ├── index.css         # 全局样式
│   └── vite-env.d.ts     # Vite 环境类型
├── .trae/                # 项目文档（PRD、技术架构）
├── eslint.config.js      # ESLint 配置
├── tailwind.config.js    # Tailwind 配置
├── tsconfig.json         # TypeScript 配置
├── vite.config.ts        # Vite 配置
└── package.json
```

## 本地存储（localStorage）

所有数据均存储在浏览器 localStorage 中，共 6 个数据键：

| 数据键 | 存储内容 | 说明 |
|--------|----------|------|
| `meeting_room_bookings` | 预订记录数组 | 所有会议预订数据 |
| `meeting_room_templates` | 预订模板数组 | 保存的常用预订模板 |
| `meeting_rooms_data` | 会议室数组 | 首次加载时使用默认会议室初始化 |
| `meeting_room_saved_views` | 保存的视图数组 | 用户保存的快捷视图配置 |
| `meeting_room_booking_change_logs` | 预订变更日志数组 | 预订的创建 / 修改 / 取消记录 |
| `meeting_room_change_logs` | 会议室变更日志数组 | 会议室的增删改 / 启停记录 |

### 数据重置

如需清除所有本地数据恢复初始状态，在浏览器控制台执行：

```javascript
Object.values({
  BOOKINGS: 'meeting_room_bookings',
  TEMPLATES: 'meeting_room_templates',
  ROOMS: 'meeting_rooms_data',
  VIEWS: 'meeting_room_saved_views',
  BOOKING_CHANGE_LOGS: 'meeting_room_booking_change_logs',
  ROOM_CHANGE_LOGS: 'meeting_room_change_logs',
}).forEach(key => localStorage.removeItem(key));
location.reload();
```

### 默认会议室

系统内置 4 个默认会议室：

| 名称 | 容量 | 位置 | 设施 |
|------|------|------|------|
| 大会议室 | 50 人 | 3 楼 | 投影、视频会议、白板、电话会议 |
| 中会议室 | 20 人 | 2 楼 | 投影、白板 |
| 小会议室 | 8 人 | 2 楼 | 白板、电话会议 |
| 洽谈室 | 6 人 | 1 楼 | 白板 |

## 本地开发注意事项

1. **数据持久化**：所有数据存储在浏览器 localStorage 中，清除浏览器数据会丢失所有预订和配置。建议定期使用导出功能备份。

2. **业务时间**：系统显示时段为 8:00 - 20:00，由 `BUSINESS_START_HOUR` 和 `BUSINESS_END_HOUR` 常量控制。

3. **时间粒度**：时间选择和时段展示以 30 分钟为最小单位，可在常量中调整。

4. **循环预订**：循环预订创建时会逐条检测冲突，冲突的时段会跳过并在结果中提示。

5. **容量匹配**：会议室推荐分为四级（完美 / 良好 / 偏大 / 过大），阈值在 `constants/index.ts` 中配置。

6. **移动端适配**：屏幕宽度小于 768px 时，左右侧栏会变为抽屉式，底部显示操作栏。

7. **主题切换**：支持明/暗主题，通过 `useTheme` Hook 管理，状态保存在 localStorage 中。

8. **导入格式**：批量导入支持 CSV 格式，表头需包含：会议室、主题、科室、参会人数、开始时间、结束时间、联系人、联系电话、备注。

## 交付验证

提交代码前，建议运行统一验证脚本确保代码质量：

```bash
npm run verify
```

该脚本依次执行以下检查，全部通过才算成功：

1. **类型检查**（`tsc -b --noEmit`）- 确保 TypeScript 类型正确
2. **代码规范**（`eslint .`）- 确保代码符合 ESLint 规则
3. **生产构建**（`vite build`）- 确保项目可以正常构建
4. **单元测试**（`vitest run`）- 确保所有测试用例通过

任一环节失败都会立即终止并返回非零退出码，方便接入 git hook 或 CI。

## 相关文档

- [产品需求文档](./.trae/documents/PRD-会议室预定系统.md)
- [技术架构文档](./.trae/documents/技术架构-会议室预定系统.md)
