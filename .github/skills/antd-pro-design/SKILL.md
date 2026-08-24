---
name: antd-pro-design
description: Design and implement enterprise-grade CRUD interfaces and complex layouts using Vite and Ant Design ProComponents. Use when building dashboards, sophisticated tables, multi-step forms, or professional layouts.
---

# Ant Design Pro Skill (Vite)

A workflow for building heavy-duty, data-driven enterprise applications using `@ant-design/pro-components`.

## Prerequisites

- Vite + React (TypeScript)
- Packages: `antd`, `@ant-design/icons`, `@ant-design/pro-components`
- Date Library: `dayjs` (AntD default)

## Process Steps

### 1. High-Level Layout (`ProLayout`)

- Use `ProLayout` to manage the application shell (Sider, Header, Breadcrumbs).
- Configure `route` objects for navigation instead of hard-coding menu items.
- Utilize `menuItemRender` and `subMenuItemRender` for integration with `react-router-dom`.
- Set `title`, `logo`, and `layout` (side, top, or mix) via the component props.

### 2. Data-Driven Tables (`ProTable`)

- **Schema First:** Define `columns` using the `ProColumns<T>` type.
- **Request API:** Use the `request` prop to handle data fetching, pagination, and filtering automatically. Do not manually manage `loading` or `dataSource` state unless necessary.
- **Search & Toolbars:** Configure `search={{ labelWidth: 'auto' }}` and `toolBarRender` for action buttons (e.g., "Create New").
- **Value Types:** Leverage `valueType` (e.g., `money`, `date`, `progress`, `option`) to automate cell rendering.

### 3. Sophisticated Forms (`ProForm`)

- Use specialized forms: `ModalForm`, `DrawerForm`, `StepsForm`, or `QueryFilter`.
- Use **ProForm Fields** (e.g., `ProFormText`, `ProFormSelect`, `ProFormDateRangePicker`) for automatic layout and integration with AntD `Form.Item`.
- Utilize `initialValues` and `onFinish` for clean data submission logic.

### 4. Enterprise Theming & Tokens

- Wrap the app in `ConfigProvider`.
- Use `ProConfigProvider` if using dark mode or specific ProComponent token overrides.
- Access tokens via `theme.useToken()` for any custom styling to maintain consistency with ProComponents.

### 5. Vite & Performance

- **Dynamic Imports:** Use React `lazy` for pages within the `ProLayout` to keep the initial Vite bundle small.
- **Tree Shaking:** Ensure imports are structured correctly: `import { ProTable } from '@ant-design/pro-components';` to benefit from Vite's optimization.

### 6. QA Checklist

- [ ] **Request Handling:** Does the `request` function return the correct `{ data, success, total }` format?
- [ ] **ProTable Actions:** Are row actions (Edit/Delete) placed within the `option` valueType column?
- [ ] **Responsive:** Does `ProLayout` behave correctly on mobile (collapsed sider)?
- [ ] **Empty States:** Are `ProTable` empty states and skeleton loaders configured?

## Output Specification

Provide a professional implementation including:

1. `ProColumns` definitions with appropriate `valueType` and `fieldProps`.
2. A `ProTable` or `ProForm` component integrated with a mock or real `request` function.
3. Clean TypeScript interfaces for the data models.
4. Usage of `Space` or `ProCard` for sectioning and layout spacing.
