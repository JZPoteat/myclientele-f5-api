const express = require('express');
const ClientsService = require('./client-service');
const { requireAuth } = require('../middleware/jwt-auth');
const path = require('path');

const ClientsRouter = express.Router();
const jsonBodyParser = express.json();

ClientsRouter
  .route('/')
  .all(requireAuth)
  .get((req, res, next) => {
    ClientsService.getClientsForUser(
      req.app.get('db'),
      req.user.id
    )
      .then(clients => {
        const serializedClients = clients.map(client => ClientsService.serializeClient(client));
        res.json(serializedClients);
      })
      .catch(err => {
        console.log(err);
        next();
      });
  })
  .post(jsonBodyParser, (req, res, next) => {
    const { name, location, company_id, day_of_week, hours_of_operation, currently_closed, notes, general_manager } = req.body;
    
    const requiredFields = { name, location, hours_of_operation, currently_closed };
    const newClient = { name, location, company_id, day_of_week, hours_of_operation, currently_closed, notes, general_manager };

    for(const [key, value] of Object.entries(requiredFields))
      if (value == null)
        return res.status(400).json({
          error: `Missing '${key}' in request body`
        });

    newClient.sales_rep_id = req.user.id;

    ClientsService.insertClient(
      req.app.get('db'),
      newClient
    )
      .then(client => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${client.id}`))
          .json(ClientsService.serializeClient(client));
      })
      .catch(err => {
        console.log(err);
        next();
      });
  });

ClientsRouter
  .route('/:client_id')
  .all((req, res, next) => {
    ClientsService.getClient(
      req.app.get('db'),
      req.params.client_id
    )
    .then(client => {
      if(!client) {
        return res.status(404).json({
          error: { message: `Client doesn't exist`}
        })
      }
      res.client = client
      console.log('client in /:client_id', client)
      next()
    })
    .catch(next)
  })
  .get(checkClientExists, (req, res, next) => {
    console.log('got into get')
    res.json(serializedClient = ClientsService.serializeClients(res.client))
  })
  .patch(jsonBodyParser, (req, res, next) => {
    console.log('res.client.id', res.client.id)
    console.log('client_id', res.client.id)
    const id  = res.client.id
    console.log('id', id)
    const { name, location, day_of_week, hours_of_operation, currently_closed, notes, general_manager } = req.body
    const clientToUpdate = { name, location, day_of_week, hours_of_operation, currently_closed, notes, general_manager }

    ClientsService.updateClient(
      req.app.get('db'),
      req.params.client_id,
      clientToUpdate
    )
      .then(numRowsAffected => {
        console.log('got out of updateClient')
        res.status(204).end()
      })
      .catch(next)
  })
  .delete((req, res, next) => {
    ClientsService.deleteClient(
      req.app.get('db'),
      req.params.client_id
    )
      .then(numRowsAffected => {
        res.status(204).end()
      })
      .catch(next)
  })


async function checkClientExists(req, res, next) {
  try {
    const client = await ClientsService.getClient(
      req.app.get('db'),
      req.params.client_id
    )

    if(!client) {
      return res.status(404).json({
        error: 'Client not found'
      })
      res.client = client
      next()
    }
  }  catch(error) {
    next(error)
  }
}


module.exports = ClientsRouter;

