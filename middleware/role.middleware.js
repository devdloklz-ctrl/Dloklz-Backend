export const hasRole = (roles) => (req, res, next) => {
  if (!req.user?.roles) return res.status(403).json({ message: "Access denied" });

  const hasPermission = roles.some((role) => req.user.roles.includes(role));
  if (!hasPermission) return res.status(403).json({ message: "Access denied" });

  next();
};
