import mongoose from "mongoose";
import dotenv from "dotenv";
import MenuItem from "./models/MenuItem.js";

dotenv.config();

const menuData = [
  {
    category: "Mango Mania",
    items: [
      {
        name: "Thai Raw Mango Salad",
        price: 330,
        desc: "Raw mango, chilli, peanuts, coriander",
      },
      {
        name: "Mango Paneer Tikka",
        price: 510,
        desc: "Tandoori paneer, light mango marinade, mint chutney",
      },
      {
        name: "Mango Chilli Chicken",
        price: 570,
        desc: "Crispy chicken, sweet-spicy mango glaze",
      },
      {
        name: "Mango Burrata Bomb",
        price: 460,
        desc: "Burrata on mango relish, basil oil, garlic bread",
      },
      {
        name: "Mango Cheesecake",
        price: 360,
        desc: "Creamy cheesecake topped with fresh mango puree",
      },
    ],
  },

  {
    category: "Soups & Salads",
    items: [
      {
        name: "Cream of Mushroom",
        price: 310,
        desc: "Wild mushrooms, shallots, thyme, cream, truffle oil",
      },

      {
        name: "Mexican Corn Salad",
        price: 310,
        desc: "Sweet corn, cheese, bell peppers, jalapeno",
      },
    ],
  },

  {
    category: "Pizza & Pasta",
    items: [
      {
        name: "Margherita Pizza",
        price: 655,
        desc: "Mozzarella, cherry tomatoes, basil",
      },

      {
        name: "Truffle Cream Ravioli",
        price: 695,
        desc: "Mushroom, cheese ravioli with truffle cream sauce",
      },
    ],
  },
];

const importData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    await MenuItem.deleteMany();

    const formattedItems = [];

    menuData.forEach((section) => {
      section.items.forEach((item) => {
        formattedItems.push({
          ...item,
          category: section.category,
        });
      });
    });

    await MenuItem.insertMany(formattedItems);

    console.log("Menu data imported successfully");

    process.exit();
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

importData();