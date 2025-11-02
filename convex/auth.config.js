export default {
  providers: [
    {
      // La variabile d'ambiente che conterrà l'URL di Clerk
      domain: process.env.CLERK_ISSUER_URL,
      applicationID: "convex",
    },
  ],
};