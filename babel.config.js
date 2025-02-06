module.exports = {
    presets: ["module:metro-react-native-babel-preset"],
    plugins: [
      [
        "module:react-native-dotenv",
        {
          moduleName: "@env", // Nombre del módulo para las variables de entorno
          path: ".env",        // Ruta del archivo .env
          safe: false,
          allowUndefined: true,
        },
      ],
    ],
  };
  