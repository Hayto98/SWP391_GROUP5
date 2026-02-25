import { useState } from "react";
import { fakeUsers } from "./fakeData";
import { UserStatsCards } from "./UserStatsCards";
import { UserFilters } from "./UserFilters";
import { UserTable } from "./UserTable";
import { ViewUserModal } from "./ViewUserModal";
import { EditUserModal } from "./EditUserModal";
import { AddUserModal } from "./AddUserModal";

function Users() {
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setViewModalOpen(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  const handleAddUser = () => {
    setAddModalOpen(true);
  };

  return (
    <div>
      <UserStatsCards />

      <UserFilters onAddUser={handleAddUser} />

      <UserTable
        users={fakeUsers}
        onViewUser={handleViewUser}
        onEditUser={handleEditUser}
      />

      <ViewUserModal
        open={viewModalOpen}
        onOpenChange={setViewModalOpen}
        user={selectedUser}
      />

      <EditUserModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        user={selectedUser}
      />

      <AddUserModal open={addModalOpen} onOpenChange={setAddModalOpen} />
    </div>
  );
}

export default Users;
