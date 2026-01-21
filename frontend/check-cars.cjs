
// Use standard require for CJS or just run as module
// We will use standard CJS with axios
const axios = require('axios');

async function checkCars() {
  try {
    const response = await axios.get('http://localhost:3000/api/cars');
    const cars = response.data.data;
    console.log("Total cars:", cars.length);
    cars.forEach(c => {
      console.log(`Car ID: ${c.id}, Status: ${c.status}, Available: ${c.isAvailable}, Name: ${c.brand} ${c.model}`);
    });
  } catch (e) {
    console.error("Error fetching cars:", e.message);
  }
}

checkCars();
