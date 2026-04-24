const AdminButton = ({ children, variant = "primary", ...props }) => {
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    secondary: "bg-gray-100 hover:bg-gray-200 text-gray-800",
    danger: "bg-red-500 hover:bg-red-600 text-white",
  };

  return (
    <button
      className={`px-4 py-2 rounded-lg font-medium transition-all active:scale-95 ${variants[variant]}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default AdminButton;
