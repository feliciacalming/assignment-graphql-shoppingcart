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

      //kolla om produkten faktiskt finns i varukorgen
      const cartContents = await fsPromises.readFile(filePath, {
        encoding: "utf-8",
      });
      let shoppingcart = JSON.parse(cartContents);
      console.log(shoppingcart);

      /**** ska lägga till så att totalAmount uppdateras när man tar bort också!! *****/
      for (let i = 0; i < shoppingcart.products.length; i++) {
        if (productId === shoppingcart.products[i].id) {
          shoppingcart.products.splice([i], 1);
          /*varför tar den inte bort alla produkter med det id:t ens? det borde den ju göra med 
          den här koden. även om jag ska lösa så att den bara tar bort EN. wtf?*/
        }
      }

      //uppdatera varukorgen med nya listan
      await fsPromises.writeFile(filePath, JSON.stringify(shoppingcart));

      let DeletedResourceResponse = {
        deleteMessage: `Du tog bort produkten med id ${productId} ur varukorgen!`,
        deletedId: productId,
      };

      return DeletedResourceResponse;
    },
  },
};
