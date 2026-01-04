import app from "../server/_core/index";

// Forçamos a Vercel a entender que este é o handler
export default (req: any, res: any) => {
  return app(req, res);
};