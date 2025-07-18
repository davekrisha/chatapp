import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, Menu } from "lucide-react";

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();
  const { authUser, onlineUsers } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [isOpen, setIsOpen] = useState(false); // for mobile drawer

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  const filteredUsers = showOnlineOnly
    ? users.filter((user) => onlineUsers.includes(user._id))
    : users;

  if (isUsersLoading) return <SidebarSkeleton />;

  // Check if current user is online
  const isOnline = authUser && onlineUsers.map(String).includes(String(authUser._id));

  return (
    <>
      {/* Mobile sidebar toggle button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 bg-base-100 p-2 rounded shadow"
        onClick={() => setIsOpen(true)}
        aria-label="Open sidebar"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Sidebar drawer for mobile/tablet */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"} lg:hidden`}
        onClick={() => setIsOpen(false)}
      />
      <aside
        className={`fixed top-0 left-0 h-full w-4/5 max-w-xs md:w-72 md:max-w-md bg-base-100 border-r border-base-300 z-50 transform transition-transform duration-200 ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:static lg:translate-x-0 lg:w-72 lg:max-w-xs lg:flex lg:flex-col min-w-0`}
      >
        {/* Close button for mobile */}
        <div className="flex lg:hidden justify-end p-2">
          <button onClick={() => setIsOpen(false)} className="text-2xl">×</button>
        </div>
        {/* Current user's profile at the top */}
        {authUser && (
          <div className="flex flex-col items-center py-4 border-b border-base-300 min-w-0">
            <div className="relative">
              <img
                src={authUser.profilePic || "/avatar.png"}
                alt={authUser.fullName}
                className="size-16 object-cover rounded-full border"
              />
              {isOnline && (
                <span
                  className="absolute bottom-0 right-0 size-4 bg-green-500 rounded-full ring-2 ring-zinc-900"
                  title="Online"
                />
              )}
            </div>
            <div className="mt-2 font-medium text-center truncate w-20 md:w-32">{authUser.fullName}</div>
          </div>
        )}

        <div className="border-b border-base-300 w-full p-5 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <Users className="size-6" />
            <span className="font-medium hidden lg:block">Contacts</span>
          </div>
          {/* TODO: Online filter toggle */}
          <div className="mt-3 hidden lg:flex items-center gap-2 min-w-0">
            <label className="cursor-pointer flex items-center gap-2">
              <input
                type="checkbox"
                checked={showOnlineOnly}
                onChange={(e) => setShowOnlineOnly(e.target.checked)}
                className="checkbox checkbox-sm"
              />
              <span className="text-sm">Show online only</span>
            </label>
            <span className="text-xs text-zinc-500">({onlineUsers.length - 1} online)</span>
          </div>
        </div>

        <div className="overflow-y-auto w-full py-3 flex-1 min-w-0">
          {filteredUsers.map((user) => (
            <button
              key={user._id}
              onClick={() => {
                setSelectedUser(user);
                setIsOpen(false); // close sidebar on mobile after selecting user
              }}
              className={`
                w-full p-3 flex items-center gap-3
                hover:bg-base-300 transition-colors
                ${selectedUser?._id === user._id ? "bg-base-300 ring-1 ring-base-300" : ""}
                min-w-0
              `}
            >
              <div className="relative mx-auto lg:mx-0 min-w-0">
                <img
                  src={user.profilePic || "/avatar.png"}
                  alt={user.name}
                  className="size-12 object-cover rounded-full"
                />
                {onlineUsers.includes(user._id) && (
                  <span
                    className="absolute bottom-0 right-0 size-3 bg-green-500 
                    rounded-full ring-2 ring-zinc-900"
                  />
                )}
              </div>

              {/* User info - only visible on larger screens */}
              <div className="hidden lg:block text-left min-w-0">
                <div className="font-medium truncate">{user.fullName}</div>
                <div className="text-sm text-zinc-400">
                  {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                </div>
              </div>
            </button>
          ))}

          {filteredUsers.length === 0 && (
            <div className="text-center text-zinc-500 py-4">No online users</div>
          )}
        </div>
      </aside>
    </>
  );
};
export default Sidebar;