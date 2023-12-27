export type Config = {
  api: {
    url: string;
    auth: {
      name: string;
      pass: string;
    };
  };
};

const config = (await fetch("/config.json").then((response) =>
  response.json(),
)) as Config;

export default config;
