require("dotenv").config();

const apollo = require("@apollo/server");
const { resolvers } = require("./resolvers");
const { loadFiles } = require("@graphql-tools/load-files");
const { makeExecutableSchema } = require("@graphql-tools/schema");
const path = require("path");

const { expressMiddleware } = require("@apollo/server/express4");
const express = require("express");
const app = express();

// app.use(express.static(path.join(__dirname, "data")));
// app.use(express.static(path.join(__dirname, "public")));
// app.use(express.static(path.join(__dirname, "views")));

app.use(express.json());

const port = process.env.PORT || 5000;

async function run() {
  try {
    const typeDefs = await loadFiles(path.join(__dirname, "schema.graphql"));
    const schema = makeExecutableSchema({
      typeDefs: typeDefs,
      resolvers: resolvers,
    });
    const server = new apollo.ApolloServer({ schema: schema });

    await server.start();
    app.use("/graphql", expressMiddleware(server));
    app.listen(port, () => {
      console.log("server ready at http://localhost:5000");
    });
  } catch (error) {
    console.log(error);
  }
}

run();
