import React, { useState, useEffect } from 'react';
import { useCompany } from '../../contexts/CompanyContext';
import { securityService, securityUtils } from '../../services/securityService';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Plus, Edit, Trash2, Key, Shield, User, Users, Activity, Settings, Eye, EyeOff, RefreshCw, Loader2 } from 'lucide-react';

const UserManagement = () => {
  const { currentCompany } = useCompany();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isRoleManagerOpen, setIsRoleManagerOpen] = useState(false);
  const [showPasswordDetails, setShowPasswordDetails] = useState(false);

  // Load data when component mounts or company changes
  useEffect(() => {
    if (currentCompany?.id) {
      loadUserManagementData();
    }
  }, [currentCompany?.id]);

  const loadUserManagementData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load company users
      const companyUsers = await securityService.getCompanyUsers(currentCompany.id);
      setUsers(companyUsers || []);
      
      // Load roles
      const rolesData = await securityService.getRoles(currentCompany.id, {
        page: 1,
        page_size: 100
      });
      setRoles(rolesData.items || []);
      
    } catch (err) {
      console.error('Error loading user management data:', err);
      setError(err.message || 'Failed to load user management data');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadUserManagementData();
    setRefreshing(false);
  };

  const availablePermissions = [
    'Dashboard', 'Accounting', 'Sales', 'Customers', 'Vendors', 'Banking', 
    'Reports', 'Payroll', 'Inventory', 'Company Settings', 'User Management'
  ];

  const departments = ['IT', 'Finance', 'Sales', 'HR', 'Operations', 'Marketing'];

  const handleAddUser = async (userData) => {
    try {
      setLoading(true);
      
      // Use the invite user API to add new user
      const response = await securityService.inviteUser(currentCompany.id, userData);
      
      // Refresh the user list after adding
      await loadUserManagementData();
      
      setIsAddUserOpen(false);
      
      // Show success message
      alert(`User invitation sent successfully! ${response.message}`);
      
    } catch (err) {
      console.error('Error adding user:', err);
      alert(`Failed to add user: ${err.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (updatedUser) => {
    try {
      setLoading(true);
      
      // Use the update user API
      const response = await securityService.updateCompanyUser(currentCompany.id, updatedUser.id, updatedUser);
      
      // Refresh the user list after updating
      await loadUserManagementData();
      
      setSelectedUser(null);
      
      // Show success message
      alert(`User updated successfully! ${response.message}`);
      
    } catch (err) {
      console.error('Error updating user:', err);
      alert(`Failed to update user: ${err.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        setLoading(true);
        
        // Use the remove user API
        const response = await securityService.removeCompanyUser(currentCompany.id, userId);
        
        // Refresh the user list after deletion
        await loadUserManagementData();
        
        // Show success message
        alert(`User removed successfully! ${response.message}`);
        
      } catch (err) {
        console.error('Error deleting user:', err);
        alert(`Failed to delete user: ${err.message || 'Please try again.'}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleUserStatus = async (userId) => {
    try {
      setLoading(true);
      
      // Find the user to get current status
      const user = users.find(u => u.id === userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';
      
      // Use the toggle user status API
      const response = await securityService.toggleUserStatus(currentCompany.id, userId, newStatus);
      
      // Refresh the user list after updating
      await loadUserManagementData();
      
      // Show success message
      alert(`User status updated successfully! ${response.message}`);
      
    } catch (err) {
      console.error('Error updating user status:', err);
      alert(`Failed to update user status: ${err.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (userId) => {
    const newPassword = prompt('Enter new password:');
    if (newPassword) {
      try {
        setLoading(true);
        
        // Use the reset password API
        const response = await securityService.resetUserPassword(currentCompany.id, userId, newPassword);
        
        // Refresh the user list after password reset
        await loadUserManagementData();
        
        // Show success message
        alert(`Password reset successfully! ${response.message}`);
        
      } catch (err) {
        console.error('Error resetting password:', err);
        alert(`Failed to reset password: ${err.message || 'Please try again.'}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const enableTwoFactor = async (userId) => {
    try {
      setLoading(true);
      
      // Find the user to get current 2FA status
      const user = users.find(u => u.id === userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      const newStatus = !user.twoFactorEnabled;
      
      // Use the toggle 2FA API
      const response = await securityService.toggleTwoFactor(currentCompany.id, userId, newStatus);
      
      // Refresh the user list after updating
      await loadUserManagementData();
      
      // Show success message
      const action = newStatus ? 'enabled' : 'disabled';
      alert(`Two-factor authentication ${action} successfully! ${response.message}`);
      
    } catch (err) {
      console.error('Error updating 2FA setting:', err);
      alert(`Failed to update 2FA setting: ${err.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  const getUsersNeedingPasswordReset = () => {
    const today = new Date();
    return users.filter(user => {
      const expiryDate = new Date(user.passwordExpiry);
      const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 7;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading user management data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 mb-4">Error: {error}</div>
          <Button onClick={loadUserManagementData} className="bg-blue-600 hover:bg-blue-700">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage users, roles, and permissions</p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={refreshData}
            disabled={refreshing}
            variant="outline"
            className="flex items-center"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={() => setIsRoleManagerOpen(true)}
            variant="outline"
            className="flex items-center"
          >
            <Shield className="w-4 h-4 mr-2" />
            Manage Roles
          </Button>
          <Button
            onClick={() => setIsAddUserOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Security Alerts */}
      {getUsersNeedingPasswordReset().length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Key className="w-5 h-5 text-yellow-600 mr-2" />
              <span className="text-sm font-medium text-yellow-800">
                {getUsersNeedingPasswordReset().length} user(s) need password reset within 7 days
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-green-600">
                  {users.filter(u => u.status === 'Active').length}
                </p>
              </div>
              <Activity className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">2FA Enabled</p>
                <p className="text-2xl font-bold text-purple-600">
                  {users.filter(u => u.twoFactorEnabled).length}
                </p>
              </div>
              <Shield className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Roles</p>
                <p className="text-2xl font-bold text-orange-600">{roles.length}</p>
              </div>
              <Settings className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="w-5 h-5 mr-2" />
            User Accounts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">User</th>
                  <th className="text-left p-3">Role</th>
                  <th className="text-left p-3">Department</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Last Login</th>
                  <th className="text-left p-3">2FA</th>
                  <th className="text-left p-3">Password</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.fullName}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant={user.role === 'Super Admin' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="p-3">{user.department}</td>
                    <td className="p-3">
                      <Badge variant={user.status === 'Active' ? 'success' : 'destructive'}>
                        {user.status}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div>
                        <p className="text-sm text-gray-900">{user.lastLogin}</p>
                        <p className="text-xs text-gray-600">{user.loginCount} logins</p>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant={user.twoFactorEnabled ? 'success' : 'secondary'}>
                        {user.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="text-sm">
                        <p className="text-gray-900">
                          Expires: {user.passwordExpiry}
                        </p>
                        <p className="text-xs text-gray-600">
                          {Math.ceil((new Date(user.passwordExpiry) - new Date()) / (1000 * 60 * 60 * 24))} days
                        </p>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedUser(user)}
                          className="p-1"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resetPassword(user.id)}
                          className="p-1"
                        >
                          <Key className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => enableTwoFactor(user.id)}
                          className="p-1"
                        >
                          <Shield className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleUserStatus(user.id)}
                          className="p-1"
                        >
                          {user.status === 'Active' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <AddUserForm 
            onSubmit={handleAddUser} 
            onCancel={() => setIsAddUserOpen(false)}
            roles={roles} 
            departments={departments} 
          />
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={selectedUser !== null} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <EditUserForm 
              user={selectedUser} 
              onSubmit={handleUpdateUser} 
              onCancel={() => setSelectedUser(null)}
              roles={roles} 
              departments={departments}
              availablePermissions={availablePermissions}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Role Manager Dialog */}
      <Dialog open={isRoleManagerOpen} onOpenChange={setIsRoleManagerOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Role Management</DialogTitle>
          </DialogHeader>
          <RoleManager 
            roles={roles} 
            setRoles={setRoles} 
            availablePermissions={availablePermissions} 
            currentCompany={currentCompany}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Add User Form Component
const AddUserForm = ({ onSubmit, onCancel, roles, departments }) => {
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    role: '',
    department: '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    onSubmit(formData);
    setFormData({
      username: '',
      fullName: '',
      email: '',
      role: '',
      department: '',
      password: '',
      confirmPassword: ''
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
          <Input
            value={formData.username}
            onChange={(e) => setFormData({...formData, username: e.target.value})}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <Input
            value={formData.fullName}
            onChange={(e) => setFormData({...formData, fullName: e.target.value})}
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <select
            value={formData.role}
            onChange={(e) => setFormData({...formData, role: e.target.value})}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          >
            <option value="">Select Role</option>
            {roles.map(role => (
              <option key={role.id} value={role.name}>{role.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
          <select
            value={formData.department}
            onChange={(e) => setFormData({...formData, department: e.target.value})}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          >
            <option value="">Select Department</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <Input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
          <Input
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
            required
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
          Add User
        </Button>
      </div>
    </form>
  );
};

// Edit User Form Component
const EditUserForm = ({ user, onSubmit, onCancel, roles, departments, availablePermissions }) => {
  const [formData, setFormData] = useState({
    ...user,
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
          <Input
            value={formData.username}
            onChange={(e) => setFormData({...formData, username: e.target.value})}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <Input
            value={formData.fullName}
            onChange={(e) => setFormData({...formData, fullName: e.target.value})}
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <select
            value={formData.role}
            onChange={(e) => setFormData({...formData, role: e.target.value})}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          >
            {roles.map(role => (
              <option key={role.id} value={role.name}>{role.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
          <select
            value={formData.department}
            onChange={(e) => setFormData({...formData, department: e.target.value})}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          >
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
          Update User
        </Button>
      </div>
    </form>
  );
};

// Role Manager Component
const RoleManager = ({ roles, setRoles, availablePermissions, currentCompany, onUpdateRole, onDeleteRole }) => {
  const [selectedRole, setSelectedRole] = useState(null);
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    permissions: []
  });

  const handleAddRole = async () => {
    if (!newRole.name || !newRole.description) {
      alert('Please fill in all fields');
      return;
    }
    
    try {
      const role = await securityService.createRole(currentCompany.id, {
        role_name: newRole.name,
        description: newRole.description,
        permissions: newRole.permissions
      });
      
      const newRoleData = {
        id: role.id,
        name: role.role_name,
        description: role.description,
        permissions: role.permissions || [],
        userCount: 0,
        isSystem: false
      };
      
      setRoles([...roles, newRoleData]);
      setNewRole({ name: '', description: '', permissions: [] });
      alert('Role created successfully!');
    } catch (err) {
      console.error('Error creating role:', err);
      alert('Failed to create role. Please try again.');
    }
  };

  const handleUpdateRole = async (roleId, updatedRole) => {
    try {
      await securityService.updateRole(currentCompany.id, roleId, {
        role_name: updatedRole.name,
        description: updatedRole.description,
        permissions: updatedRole.permissions
      });
      
      setRoles(roles.map(role => 
        role.id === roleId ? { ...role, ...updatedRole } : role
      ));
      
      alert('Role updated successfully!');
    } catch (err) {
      console.error('Error updating role:', err);
      alert('Failed to update role. Please try again.');
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      try {
        await securityService.deleteRole(currentCompany.id, roleId);
        setRoles(roles.filter(role => role.id !== roleId));
        alert('Role deleted successfully!');
      } catch (err) {
        console.error('Error deleting role:', err);
        alert('Failed to delete role. Please try again.');
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-lg font-medium mb-2">Existing Roles</h3>
          <div className="space-y-2">
            {roles.map(role => (
              <div
                key={role.id}
                className={`p-3 border rounded-md cursor-pointer ${
                  selectedRole?.id === role.id ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedRole(role)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{role.name}</p>
                    <p className="text-sm text-gray-600">{role.description}</p>
                  </div>
                  <Badge variant="outline">{role.userCount} users</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Add New Role</h3>
          <div className="space-y-3">
            <Input
              placeholder="Role Name"
              value={newRole.name}
              onChange={(e) => setNewRole({...newRole, name: e.target.value})}
            />
            <Input
              placeholder="Role Description"
              value={newRole.description}
              onChange={(e) => setNewRole({...newRole, description: e.target.value})}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Permissions</label>
              <div className="grid grid-cols-2 gap-2">
                {availablePermissions.map(permission => (
                  <div key={permission} className="flex items-center">
                    <input
                      type="checkbox"
                      id={permission}
                      checked={newRole.permissions.includes(permission)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewRole({
                            ...newRole,
                            permissions: [...newRole.permissions, permission]
                          });
                        } else {
                          setNewRole({
                            ...newRole,
                            permissions: newRole.permissions.filter(p => p !== permission)
                          });
                        }
                      }}
                      className="mr-2"
                    />
                    <label htmlFor={permission} className="text-sm text-gray-700">
                      {permission}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <Button onClick={handleAddRole} className="w-full">
              Add Role
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;