/* Express App */
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import bodyParser from 'body-parser';
import compression from 'compression';
import expressSanitizer from 'express-sanitizer';
import { CustomLogger } from '../utils';

import router from '../routes';

/* My express App */
export default function expressApp() {
  const app = express();


  const whitelist = ['https://smackpetfood.com', 'https://ca.smackpetfood.com', 'https://smack-pet-food-usa.myshopify.com', 'https://smack-pet-food.myshopify.com', 'http://localhost:8888' ]
  const corsOptions = {
    origin: function (origin, callback) {
      console.log(process.env)
      console.log("hit this shit here?")
      console.log(origin);


      if (whitelist.indexOf(origin) !== -1) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    }
  }


  // Apply express middlewares
  if(!process.env.NODE_ENV){
    app.use(cors(corsOptions));
  }


  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(expressSanitizer());

  // gzip responses
  app.use(compression());

  // Attach logger
  app.use(morgan(CustomLogger));

  // Setup routes
  app.use('/.netlify/functions/server', router);

  // catch 404 and forward to error handler
  app.use(function(req, res, next) {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
  });
  // Handle Error here.
  app.use(function(err, req, res, next) {
    res.locals.message = err.message;
    console.error('error is ', err);
    const status = err.status || 500;
    return res.status(status).json({ success: false, status, message: err.message });
  });

  return app;
}