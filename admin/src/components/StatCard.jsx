import { motion } from "framer-motion";

const StatCard = ({ title, value, icon, color }) => (
  <motion.div
    whileHover={{ y: -5 }}
    className="bg-white p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between gap-3"
  >
    <div className="min-w-0">
      <p className="text-xs sm:text-sm text-gray-500 mb-1 truncate">{title}</p>
      <h3 className="text-lg sm:text-2xl font-bold text-gray-800 line-clamp-1">
        {value}
      </h3>
    </div>
    <div
      className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${color} text-white flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center`}
    >
      {icon}
    </div>
  </motion.div>
);

export default StatCard;
