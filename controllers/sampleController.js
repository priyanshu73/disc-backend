const sayHello = (req, res) => {
  res.json({ message: 'Hello from the controller!' });
};

export default { sayHello }; 