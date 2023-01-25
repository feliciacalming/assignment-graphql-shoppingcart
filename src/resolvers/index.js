const path = require("path");
const crypto = require("node:crypto");
const axios = require("axios").default;
const fsPromises = require("fs/promises");
const { GraphQLError } = require("graphql");
const shoppingcartsDirectory = path.join(
  __dirname,
  "..",
  "data",
  "shoppingcarts"
);
const productsDirectory = path.join(__dirname, "..", "data", "products");
const { fileExists } = require("../utils/fileHandling");

exports.resolvers = {
  Mutation: {
    createShoppingcart: async (_, args) => {
      const cartId = crypto.randomUUID();

      const newCart = {
        cartId: cartId,
        products: [],
        totalAmount: 0,
      };

      const filePath = path.join(
        shoppingcartsDirectory,
        `${newCart.cartId}.json`
      );

      //skapa en ny fil för den nya användaren i /data/users
      await fsPromises.writeFile(filePath, JSON.stringify(newCart));

      //skapa responsen
      return newCart;
    },

    createProduct: async (_, args) => {
      const { title, price } = args.input;
      const id = crypto.randomUUID();

      const newProduct = {
        productId: id,
        title: title,
        price: price,
      };

      //skapa ny fil för nya produkten i data/products
      const filePath = path.join(productsDirectory, `${newProduct.id}.json`);
      await fsPromises.writeFile(filePath, JSON.stringify(newProduct));

      return newProduct;
    },

    addProductToCart: async (_, args) => {
      //varukorgsid, produktid, skicka in i varukorgens lista
      //uppdatera varukorgens totalamount

      const { cartId, productId } = args;
      const productFilepath = path.join(productsDirectory, `${productId}.json`);

      const fileContents = await fsPromises.readFile(productFilepath, {
        encoding: "utf-8",
      });
      const productToCart = JSON.parse(fileContents);

      //kolla att shoppingcarten finns
      const filePath = path.join(shoppingcartsDirectory, `${cartId}.json`);
      const shoppingcartExists = await fileExists(filePath);

      if (!shoppingcartExists) {
        return new GraphQLError("This shoppingcart doesn't exist!");
      }

      //lägg till produkten i varukorgens produktlista
      const products = [];
      products.push(productToCart);

      const totalAmount = 50;

      //uppdatera varukorgen
      const updatedCart = { cartId, products, totalAmount };
      await fsPromises.writeFile(filePath, JSON.stringify(updatedCart));

      return updatedCart;
    },
  },
};
