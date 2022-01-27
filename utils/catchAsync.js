module.exports = (fn) => {
  return (req, res, next) =>
    // Async fn, returns promise, so we can use catch
    fn(req, res, next).catch(next);
};
