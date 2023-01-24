const path = require("path");
const crypto = require("node:crypto");
const axios = require("axios").default;
const fsPromises = require("fs/promises");
const { GraphQLError } = require("graphql");
const usersDirectory = path.join(__dirname, "..", "data", "users");
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
    createUser: async (_, args) => {
      const { firstname, lastname, email } = args.input;
      const userId = crypto.randomUUID();

      //kolla om användaren redan finns

      const users = await fsPromises.readdir(usersDirectory);
      const userData = [];

      console.log("test");

      //vad gör man med DS_Store? den låg som en fil i users och ställde till det med felet Unexpected token \u0000 in JSON at position..
      for (const file of users) {
        const filePath = path.join(usersDirectory, file);
        const fileContents = await fsPromises.readFile(filePath, {
          encoding: "utf-8",
        });
        console.log(fileContents);
        const data = JSON.parse(fileContents);
        console.log(data);
        userData.push(data);
        console.log(userData);
      }

      //skapa ny unik användare + shoppingcart
      const newUser = {
        userId: userId,
        firstname: firstname,
        lastname: lastname,
        email: email,
      };

      const newCart = {
        cartId: userId,
        products: [],
        totalAmount: 0,
      };

      const filePath = path.join(usersDirectory, `${newUser.userId}.json`);
      const cartFilePath = path.join(
        shoppingcartsDirectory,
        `${newUser.userId}.json`
      );

      //kolla om användaren redan finns
      let userExists = false;

      userData.forEach((item) => {
        console.log(item.email);
        if (item.email === email) {
          userExists = true;
        }
      });

      if (userExists)
        return new GraphQLError(
          "Det finns redan en användare med den här mailadressen!"
        );

      //skapa en ny fil för den nya användaren i /data/users
      await fsPromises.writeFile(filePath, JSON.stringify(newUser));
      await fsPromises.writeFile(cartFilePath, JSON.stringify(newCart));

      //skapa responsen
      return newUser;
    },
  },
};
