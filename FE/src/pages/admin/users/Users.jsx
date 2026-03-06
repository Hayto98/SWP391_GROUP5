import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { UserStatsCards } from "./UserStatsCards";
import { UserFilters } from "./UserFilters";
import { UserTable } from "./UserTable";
import { ViewUserModal } from "./ViewUserModal";
import { EditUserModal } from "./EditUserModal";
import { AddUserModal } from "./AddUserModal";
import { getUserById, getUsers } from "@/services/adminService";

function Users() {
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [keyword, setKeyword] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const searchTriggeredRef = useRef(false);

  const fetchUsers = async (overrides = {}) => {
    setLoading(true);
    try {
      const params = {
        page: overrides.page ?? page,
        limit: overrides.limit ?? limit,
        keyword: overrides.keyword ?? keyword,
        role: overrides.role ?? role,
      };
      const data = await getUsers(params);
      setUsers(data.users || []);
      setTotal(data.total || 0);
      if (overrides.page !== undefined) setPage(overrides.page);
    } catch (error) {
      toast.error(error.message || "Không thể tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchTriggeredRef.current) {
      searchTriggeredRef.current = false;
      return;
    }
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, role]);

  const handleSearch = () => {
    searchTriggeredRef.current = true;
    fetchUsers({ page: 1 });
  };

  const handleRoleChange = (v) => {
    setRole(v);
    setPage(1);
  };

  const handleViewUser = async (user) => {
    setViewModalOpen(true);
    setViewLoading(true);
    try {
      const userDetail = await getUserById(user.userAccountId);
      setSelectedUser(userDetail);
    } catch (error) {
      setViewModalOpen(false);
      toast.error(error.message || "Không thể tải thông tin người dùng");
    } finally {
      setViewLoading(false);
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  const handleAddUser = () => {
    setAddModalOpen(true);
  };

  const handleUserUpdated = () => {
    fetchUsers();
  };

  return (
    <div>
      <UserStatsCards />

      <UserFilters
        keyword={keyword}
        role={role}
        onKeywordChange={setKeyword}
        onRoleChange={handleRoleChange}
        onSearch={handleSearch}
        onAddUser={handleAddUser}
      />

      <UserTable
        users={users}
        total={total}
        page={page}
        limit={limit}
        loading={loading}
        onPageChange={setPage}
        onLimitChange={setLimit}
        onViewUser={handleViewUser}
        onEditUser={handleEditUser}
      />

      <ViewUserModal
        open={viewModalOpen}
        onOpenChange={setViewModalOpen}
        user={selectedUser}
        loading={viewLoading}
      />

      <EditUserModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        user={selectedUser}
        onSuccess={handleUserUpdated}
      />

      <AddUserModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onSuccess={handleUserUpdated}
      />
    </div>
  );
}

export default Users;
