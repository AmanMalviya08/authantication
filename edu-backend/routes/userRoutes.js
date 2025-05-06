const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUsersByRole,
  getUserCounts,
  bulkDeleteUsers
} = require("../controllers/userController");

const { protect } = require("../middleware/auth");

// All routes protected
router.use(protect);

router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

router.get("/role/:role", getUsersByRole);
router.get("/counts", getUserCounts);
router.delete("/bulk-delete", bulkDeleteUsers);

module.exports = router;