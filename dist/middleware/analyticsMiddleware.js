export default function analyticsMiddleware(req, res, next) {
    console.log(`${req.method} ${req.path} - IP: ${req.ip}`);
    next();
}
