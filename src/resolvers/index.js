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
  Query: {
    getShoppingcartById: async (_, args) => {
      const { cartId } = args;

      const filePath = path.join(shoppingcartsDirectory, `${cartId}.json`);
      const shoppingcartExists = await fileExists(filePath);

      const shoppingcart = JSON.parse(
        await fsPromises.readFile(filePath, {
          encoding: "utf-8",
        })
      );

      if (!shoppingcartExists) {
        return new GraphQLError("This shoppingcart doesn't exist!");
      }

      return shoppingcart;
    },

    getProductById: async (_, args) => {
      const { productId } = args;

      const filePath = path.join(productsDirectory, `${productId}.json`);
      const productExists = await fileExists(filePath);

      if (!productExists) {
        return new GraphQLError("This product doesn't exist!");
      }

      const product = JSON.parse(
        await fsPromises.readFile(filePath, {
          encoding: "utf-8",
        })
      );

      return product;
    },
  },

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

      //skapa en ny fil för den nya shoppingcarten i /data/shoppingcart
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
      const { cartId, productId } = args;

      //kolla att shoppingcarten finns
      const filePath = path.join(shoppingcartsDirectory, `${cartId}.json`);
      const shoppingcartExists = await fileExists(filePath);

      if (!shoppingcartExists) {
        return new GraphQLError("This shoppingcart doesn't exist!");
      }

      //kolla att produkten finns i sortimentet
      const productFilepath = path.join(productsDirectory, `${productId}.json`);
      const productExists = await fileExists(productFilepath);

      if (!productExists) {
        return new GraphQLError("This product doesn't exist!");
      }

      //readFile på shoppingcart
      const cartContents = await fsPromises.readFile(filePath, {
        encoding: "utf-8",
      });
      let shoppingcart = JSON.parse(cartContents);

      //readFile på product
      const fileContents = await fsPromises.readFile(productFilepath, {
        encoding: "utf-8",
      });
      const productToCart = JSON.parse(fileContents);

      //lägg till produkten i varukorgens produktlista
      const products = shoppingcart.products;
      shoppingcart.products.push(productToCart);

      //uppdatera totalamount
      let totalAmount = 0;
      for (let i = 0; i < shoppingcart.products.length; i++) {
        totalAmount += shoppingcart.products[i].price;
      }

      //uppdatera varukorgen
      const updatedCart = { cartId, products, totalAmount };
      await fsPromises.writeFile(filePath, JSON.stringify(updatedCart));

      console.log(shoppingcart.products);
      // console.log(productToCart);
      return updatedCart;
    },

    deleteProductById: async (_, args) => {
      const { cartId, productId } = args;

      //kolla att shoppingcarten finns
      const filePath = path.join(shoppingcartsDirectory, `${cartId}.json`);
      const shoppingcartExists = await fileExists(filePath);

      if (!shoppingcartExists) {
        return new GraphQLError("This shoppingcart doesn't exist!");
      }

      //kolla om produkten faktiskt finns i varukorgen *******FIXA!!!!!!******
      const shoppingcart = JSON.parse(
        await fsPromises.readFile(filePath, {
          encoding: "utf-8",
        })
      );

      /**** ska lägga till så att totalAmount uppdateras när man tar bort också!! *****/
      // let shoppingcartLength = shoppingcart.products.length;
      let found = false;
      // let totalAmount = shoppingcart.totalAmount;

      for (let i = 0; i < shoppingcart.products.length; i++) {
        if (
          productId === shoppingcart.products[i].productId &&
          found === false
        ) {
          shoppingcart.totalAmount -= shoppingcart.products[i].price;
          shoppingcart.products.splice([i], 1);
          found = true;
        }
      }

      if (!found) {
        return new GraphQLError("This product is not in your shoppingcart!");
      }

      //uppdatera varukorgen med nya listan
      await fsPromises.writeFile(filePath, JSON.stringify(shoppingcart));

      let DeletedResourceResponse = {
        deleteMessage: `Du tog bort produkten med id ${productId} ur varukorgen!`,
        deletedId: productId,
      };

      return DeletedResourceResponse;
    },

    deleteShoppingcart: async (_, args) => {
      const { cartId } = args;

      const filePath = path.join(shoppingcartsDirectory, `${cartId}.json`);
      const shoppingcartExists = await fileExists(filePath);

      if (!shoppingcartExists) {
        return new GraphQLError("This shoppingcart doesn't exist!");
      }

      //ta bort varukorgen
      if (shoppingcartExists) {
        await fsPromises.unlink(filePath);
      }

      //return
      return {
        deleteMessage: `Du tog bort varukorgen med id: ${cartId}`,
        deletedId: cartId,
      };
    },
  },
};
