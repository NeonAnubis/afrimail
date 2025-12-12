import React, { useEffect, useState } from 'react';
import { Tag, Plus, Edit2, Trash2, Users as UsersIcon, Eye, UserPlus, X, Search, TrendingUp, Layers } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Loading } from '../../components/ui/Loading';
import { Modal } from '../../components/ui/Modal';
import { Toast, ToastContainer } from '../../components/ui/Toast';
import { ApiClient } from '../../lib/api';
import { AdminLayout } from '../../components/layouts/AdminLayout';
import { StatCard } from '../../components/ui/StatCard';

interface UserGroup {
  id: string;
  name: string;
  description: string;
  color: string;
  member_count: number;
  created_at: string;
}

interface GroupMember {
  id: string;
  email: string;
  name: string;
  created_at: string;
  added_at?: string;
}

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_suspended: boolean;
}

const COLOR_OPTIONS = [
  { value: 'gray', label: 'Gray', bgClass: 'bg-gray-100', textClass: 'text-gray-800' },
  { value: 'red', label: 'Red', bgClass: 'bg-red-100', textClass: 'text-red-800' },
  { value: 'yellow', label: 'Yellow', bgClass: 'bg-yellow-100', textClass: 'text-yellow-800' },
  { value: 'green', label: 'Green', bgClass: 'bg-green-100', textClass: 'text-green-800' },
  { value: 'blue', label: 'Blue', bgClass: 'bg-blue-100', textClass: 'text-blue-800' },
  { value: 'teal', label: 'Teal', bgClass: 'bg-teal-100', textClass: 'text-teal-800' },
];

export const Groups: React.FC = () => {
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [groupSearchTerm, setGroupSearchTerm] = useState('');
  const [colorFilter, setColorFilter] = useState<string>('all');
  const [memberCountFilter, setMemberCountFilter] = useState<string>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: 'blue',
  });

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching groups...');
      const data = await ApiClient.get<UserGroup[]>('/admin/groups');
      console.log('Groups fetched:', data);
      setGroups(data);
    } catch (error: any) {
      console.error('Error fetching groups:', error);
      setToast({ message: error.message || 'Failed to fetch groups', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGroupMembers = async (groupId: string) => {
    setIsLoadingMembers(true);
    try {
      const data = await ApiClient.get<GroupMember[]>(`/admin/groups/${groupId}/members`);
      setGroupMembers(data);
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to fetch members', type: 'error' });
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const data = await ApiClient.get<User[]>('/admin/users');
      setAllUsers(data);
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to fetch users', type: 'error' });
    }
  };

  const handleAddMembers = async () => {
    if (!selectedGroup || selectedUsers.length === 0) return;

    try {
      await ApiClient.post(`/admin/groups/${selectedGroup.id}/bulk-add`, {
        user_ids: selectedUsers
      });

      setGroups(groups.map((g) =>
        g.id === selectedGroup.id
          ? { ...g, member_count: g.member_count + selectedUsers.length }
          : g
      ));

      await fetchGroupMembers(selectedGroup.id);
      setShowAddMembersModal(false);
      setSelectedUsers([]);
      setSearchTerm('');
      setToast({ message: `${selectedUsers.length} member(s) added successfully`, type: 'success' });
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to add members', type: 'error' });
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedGroup) return;
    if (!confirm('Remove this user from the group?')) return;

    try {
      await ApiClient.delete(`/admin/groups/${selectedGroup.id}/members/${userId}`);

      setGroupMembers(groupMembers.filter((m) => m.id !== userId));
      setGroups(groups.map((g) =>
        g.id === selectedGroup.id
          ? { ...g, member_count: Math.max(0, g.member_count - 1) }
          : g
      ));

      setToast({ message: 'Member removed successfully', type: 'success' });
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to remove member', type: 'error' });
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const newGroup = await ApiClient.post<UserGroup>('/admin/groups', formData);
      setGroups([...groups, { ...newGroup, member_count: 0 }]);
      setShowModal(false);
      setFormData({ name: '', description: '', color: 'blue' });
      setToast({ message: 'Group created successfully', type: 'success' });
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to create group', type: 'error' });
    }
  };

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;

    try {
      const updated = await ApiClient.put<UserGroup>(`/admin/groups/${selectedGroup.id}`, formData);
      setGroups(groups.map((g) => (g.id === selectedGroup.id ? { ...updated, member_count: selectedGroup.member_count } : g)));
      setShowModal(false);
      setSelectedGroup(null);
      setFormData({ name: '', description: '', color: 'blue' });
      setToast({ message: 'Group updated successfully', type: 'success' });
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to update group', type: 'error' });
    }
  };

  const handleDeleteGroup = async (group: UserGroup) => {
    if (!confirm(`Delete group "${group.name}"? All members will be removed from this group.`)) return;

    try {
      await ApiClient.delete(`/admin/groups/${group.id}`);
      setGroups(groups.filter((g) => g.id !== group.id));
      setToast({ message: 'Group deleted successfully', type: 'success' });
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to delete group', type: 'error' });
    }
  };

  const openEditModal = (group: UserGroup) => {
    setSelectedGroup(group);
    setFormData({
      name: group.name,
      description: group.description,
      color: group.color,
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setSelectedGroup(null);
    setFormData({ name: '', description: '', color: 'blue' });
    setShowModal(true);
  };

  const openMembersModal = async (group: UserGroup) => {
    setSelectedGroup(group);
    await fetchGroupMembers(group.id);
    setShowMembersModal(true);
  };

  const openAddMembersModal = async () => {
    if (allUsers.length === 0) {
      await fetchAllUsers();
    }
    setShowAddMembersModal(true);
    setSelectedUsers([]);
    setSearchTerm('');
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const getAvailableUsers = () => {
    const memberIds = new Set(groupMembers.map(m => m.id));
    return allUsers
      .filter(user => !memberIds.has(user.id))
      .filter(user =>
        searchTerm === '' ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
      );
  };

  const getFilteredGroups = () => {
    return groups.filter(group => {
      const matchesSearch = groupSearchTerm === '' ||
        group.name.toLowerCase().includes(groupSearchTerm.toLowerCase()) ||
        group.description.toLowerCase().includes(groupSearchTerm.toLowerCase());

      const matchesColor = colorFilter === 'all' || group.color === colorFilter;

      let matchesMemberCount = true;
      if (memberCountFilter === 'empty') {
        matchesMemberCount = group.member_count === 0;
      } else if (memberCountFilter === 'small') {
        matchesMemberCount = group.member_count > 0 && group.member_count <= 5;
      } else if (memberCountFilter === 'medium') {
        matchesMemberCount = group.member_count > 5 && group.member_count <= 15;
      } else if (memberCountFilter === 'large') {
        matchesMemberCount = group.member_count > 15;
      }

      return matchesSearch && matchesColor && matchesMemberCount;
    });
  };

  const getColorClasses = (color: string) => {
    const colorOption = COLOR_OPTIONS.find(c => c.value === color);
    return colorOption || COLOR_OPTIONS[4];
  };

  const getGroupStats = () => {
    const totalMembers = groups.reduce((sum, g) => sum + g.member_count, 0);
    const avgMembers = groups.length > 0 ? Math.round(totalMembers / groups.length) : 0;
    const emptyGroups = groups.filter(g => g.member_count === 0).length;
    const largestGroup = groups.length > 0
      ? groups.reduce((max, g) => g.member_count > max.member_count ? g : max, groups[0])
      : null;

    return {
      totalGroups: groups.length,
      totalMembers,
      avgMembers,
      emptyGroups,
      largestGroup
    };
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <Loading />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div>
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">User Groups</h1>
            <p className="text-gray-600">
              Organize users into groups for easier bulk management
            </p>
          </div>
          <Button onClick={openCreateModal} variant="primary">
            <Plus className="w-4 h-4 mr-2" />
            Create Group
          </Button>
        </div>

        {groups.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <StatCard
              title="Total Groups"
              value={getGroupStats().totalGroups}
              icon={Layers}
            />
            <StatCard
              title="Total Members"
              value={getGroupStats().totalMembers}
              icon={UsersIcon}
            />
            <StatCard
              title="Avg Members/Group"
              value={getGroupStats().avgMembers}
              icon={TrendingUp}
            />
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Largest Group</span>
                  <Tag className="w-5 h-5 text-gray-400" />
                </div>
                {getGroupStats().largestGroup ? (
                  <>
                    <div className="text-2xl font-bold text-gray-900">
                      {getGroupStats().largestGroup?.name}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {getGroupStats().largestGroup?.member_count} members
                    </p>
                  </>
                ) : (
                  <div className="text-2xl font-bold text-gray-400">N/A</div>
                )}
              </div>
            </Card>
          </div>
        )}

        <Card className="mb-6">
          <div className="p-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search groups..."
                  value={groupSearchTerm}
                  onChange={(e) => setGroupSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={colorFilter}
                onChange={(e) => setColorFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Colors</option>
                {COLOR_OPTIONS.map(color => (
                  <option key={color.value} value={color.value}>{color.label}</option>
                ))}
              </select>

              <select
                value={memberCountFilter}
                onChange={(e) => setMemberCountFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Sizes</option>
                <option value="empty">Empty (0 members)</option>
                <option value="small">Small (1-5 members)</option>
                <option value="medium">Medium (6-15 members)</option>
                <option value="large">Large (16+ members)</option>
              </select>
            </div>

            {(groupSearchTerm || colorFilter !== 'all' || memberCountFilter !== 'all') && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing {getFilteredGroups().length} of {groups.length} groups
                </p>
                <button
                  onClick={() => {
                    setGroupSearchTerm('');
                    setColorFilter('all');
                    setMemberCountFilter('all');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </Card>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {getFilteredGroups().map((group) => {
            const colorClasses = getColorClasses(group.color);
            return (
              <Card key={group.id}>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 ${colorClasses.bgClass} rounded-lg`}>
                        <Tag className={`w-6 h-6 ${colorClasses.textClass}`} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {group.name}
                        </h3>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">{group.description}</p>

                  <div className="flex items-center gap-2 mb-4">
                    <UsersIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">
                      {group.member_count} {group.member_count === 1 ? 'member' : 'members'}
                    </span>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => openMembersModal(group)}
                      className="flex-1 p-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <button
                      onClick={() => openEditModal(group)}
                      className="flex-1 p-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteGroup(group)}
                      className="flex-1 p-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}

          {getFilteredGroups().length === 0 && (
            <div className="col-span-full">
              <Card>
                <div className="text-center py-12">
                  <Tag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {groups.length === 0 ? 'No Groups Yet' : 'No Groups Found'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {groups.length === 0
                      ? 'Create your first group to organize users'
                      : 'Try adjusting your filters to see more results'}
                  </p>
                  {groups.length === 0 ? (
                    <Button onClick={openCreateModal} variant="primary">
                      Create First Group
                    </Button>
                  ) : (
                    <button
                      onClick={() => {
                        setGroupSearchTerm('');
                        setColorFilter('all');
                        setMemberCountFilter('all');
                      }}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>

        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={selectedGroup ? 'Edit Group' : 'Create Group'}
        >
          <form onSubmit={selectedGroup ? handleUpdateGroup : handleCreateGroup}>
            <div className="space-y-4">
              <Input
                label="Group Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g., Engineering, Sales, Beta Testers"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe this group..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Badge Color
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        formData.color === color.value
                          ? 'border-blue-600 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`${color.bgClass} ${color.textClass} px-3 py-1 rounded text-sm font-medium text-center`}>
                        {color.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" variant="primary" className="flex-1">
                  {selectedGroup ? 'Update Group' : 'Create Group'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </form>
        </Modal>

        <Modal
          isOpen={showMembersModal}
          onClose={() => setShowMembersModal(false)}
          title={`${selectedGroup?.name} - Members`}
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                {groupMembers.length} {groupMembers.length === 1 ? 'member' : 'members'}
              </p>
              <Button
                onClick={openAddMembersModal}
                variant="primary"
                size="sm"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add Members
              </Button>
            </div>

            {isLoadingMembers ? (
              <div className="py-8 text-center">
                <Loading />
              </div>
            ) : groupMembers.length > 0 ? (
              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {groupMembers.map((member) => (
                  <div key={member.id} className="py-3 first:pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{member.name}</p>
                        <p className="text-sm text-gray-600">{member.email}</p>
                        {member.added_at && (
                          <p className="text-xs text-gray-500 mt-1">
                            Added {new Date(member.added_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove member"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">No members in this group yet</p>
                <Button onClick={openAddMembersModal} variant="primary">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add First Member
                </Button>
              </div>
            )}

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowMembersModal(false)}
            >
              Close
            </Button>
          </div>
        </Modal>

        <Modal
          isOpen={showAddMembersModal}
          onClose={() => setShowAddMembersModal(false)}
          title="Add Members"
        >
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {selectedUsers.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  {selectedUsers.length} user(s) selected
                </p>
              </div>
            )}

            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
              {getAvailableUsers().length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {getAvailableUsers().map((user) => (
                    <label
                      key={user.id}
                      className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div className="ml-3 flex-1">
                        <p className="font-medium text-gray-900">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                      {user.is_suspended && (
                        <Badge variant="error">Suspended</Badge>
                      )}
                    </label>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? 'No users found matching your search' : 'All users are already members'}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleAddMembers}
                variant="primary"
                className="flex-1"
                disabled={selectedUsers.length === 0}
              >
                Add {selectedUsers.length > 0 ? `${selectedUsers.length} ` : ''}Member(s)
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAddMembersModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>

        {toast && (
          <ToastContainer>
            <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
          </ToastContainer>
        )}
      </div>
    </AdminLayout>
  );
};
