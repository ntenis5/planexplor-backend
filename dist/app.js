import express from 'express';
const app = express();
const PORT = process.env.PORT;

app.get('/', (req, res) => {
  res.json({ message: 'Planexplor API is running!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
