# Task: Gộp menu Sidebar và tối ưu UI Tuyển dụng

## Plan

### 1. Sidebar Changes

- [x] Combine "Quản lý Hồ sơ" and "Quản lý Tuyển dụng" into "Tuyển dụng" with Briefcase icon
- [x] Add expandable sub-menu with "Tin tuyển dụng" and "Hồ sơ ứng viên"

### 2. Backend Updates

- [x] Add jobId field to jobApplicationModel
- [x] Add isArchived field for tracking archived applications
- [x] Update submitJobApplication to save jobId
- [x] Update deleteJob to handle related applications (archive them)

### 3. ApplicationManagement.jsx Updates

- [x] Add filter dropdown to filter by job posting
- [x] Keep existing Stats cards

### 4. JobManagement.jsx

- [x] Keep existing Stats cards (no changes needed)

## Status: Completed
