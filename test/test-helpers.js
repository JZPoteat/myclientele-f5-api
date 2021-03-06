const knex = require('knex')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

function makeKnexInstance() {
  return knex({
    client: 'pg',
    connection: process.env.TEST_DATABASE_URL
  })
}

function seedUsers(db, users) {
  const preppedUsers = users.map(user => ({
    ...user,
    password: bcrypt.hashSync(user.password, 1)
  }))
  const testCompanies = makeCompanyArray();
  return db.transaction(async trx => {
    await seedCompanies(trx, testCompanies)
    await trx.into('myclientele_user').insert(preppedUsers)
    await trx.raw(
      `SELECT setval('myclientele_user_id_seq', ?)`,
      [users[users.length - 1].id],
  ) 
  })

}

function seedCompanies(db, companies) {
  return db.into('company').insert(companies)
    .then(() => 
      db.raw(
        `SELECT setval('company_id_seq', ?)`,
        [companies[companies.length - 1].id],
      )
    )
}

function makeCompanyArray() {
  return [
    {
      id: 1,
      name: 'Test company 1',
      location: 'Test location 1',
      company_code: 'testcode1'
    },
    {
      id: 2,
      name: 'Test company 2',
      location: 'Test location 2',
      company_code: 'testcode2'
    }
  ];
}

function makeTestUsers() {
  return [
    {
      id: 1,
      name: 'test-user-1',
      user_name: 'test-user-name-1',
      email: 'test@email.com',
      password: 'password',
      company_id: 1,
      admin: true
    },
    {
      id: 2,
      name: 'test-user-2',
      user_name: 'test-user-name-2',
      email: 'test2@email.com',
      password: 'password',
      company_id: 2,
      admin: true
    }
  ]
}

function makeClientsAndReports(user) {
  const clients = [
    {
      id: 1,
      name: 'test-name',
      location: 'test-location',
      sales_rep_id: user.id,
      company_id: user.company_id,
      lat: null,
      lng: null,
      photo: '',
      hours_of_operation: 'Mo-Su',
      currently_closed: false,
      general_manager: 'test-gm',
      notes: 'test-notes',
      day_of_week: 2
    },
    {
      id: 2,
      name: 'test-name2',
      location: 'test-location2',
      sales_rep_id: 2,
      photo: '',
      company_id: user.company_id,
      hours_of_operation: 'Mo-Su',
      lat: null,
      lng: null,
      currently_closed: false,
      general_manager: 'test-gm2',
      notes: 'test-notes2',
      day_of_week: 2
    }
  ]

  const reports = [
    {
      id: 1,
      client_id: 1,
      sales_rep_id: user.id,
      date: '2016-06-23T02:10:25.000Z',
      notes: 'test-notes',
    },
    {
      id: 2,
      client_id: 1,
      sales_rep_id: user.id,
      date: '2016-06-23T02:10:25.000Z',
      notes: 'test-notes2',
    }
  ]

  const photos = [
    {
      id: 1,
      report_id: 1,
      sales_rep_id: 1,
      photo_url:  'https://picsum.photos/200/300'
    },
    {
      id: 2,
      report_id: 1,
      sales_rep_id: 1,
      photo_url:  'https://picsum.photos/200/300'
    },
    {
      id: 3,
      report_id: 2,
      sales_rep_id: 2,
      photo_url:  'https://picsum.photos/200/300'
    },
    {
      id: 4,
      report_id: 2,
      sales_rep_id: 2,
      photo_url:  'https://picsum.photos/200/300'
    }
  ]

  return [clients, reports, photos]
}

function makeAuthHeader(user, secret = process.env.JWT_SECRET) {
  const token = jwt.sign({ user_id: user.id }, secret, {
    subject: user.user_name,
    algorithm: 'HS256'
  })
  return `Bearer ${token}`

}

function seedUsersClientsReports (db, users, clients, reports, photos) {
  reports.forEach(report => {
    if (report.photos) {
      delete report.photos;
    }
  })
  return db.transaction(async trx => {
    await seedUsers(db, users)
    await trx.into('client').insert(clients)
    await trx.raw(
      `SELECT setval('client_id_seq', ?)`,
      [clients[clients.length - 1].id],
    )
    await trx.into('report').insert(reports)
    await trx.raw(
      `SELECT setval('report_id_seq', ?)`,
      [reports[reports.length - 1].id],
    )
    await trx.into('photo').insert(photos)
    await trx.raw(
      `SELECT setval('photo_id_seq', ?)`,
      [photos[photos.length - 1].id],
    )
  })
}

function makeClients() {
  return [
    {
      id: 1,
      name: 'test-name',
      location: 'test-location',
      sales_rep_id: 1,
      company_id: 1,
      lat: null,
      lng: null,
      photo: '',
      hours_of_operation: 'Mo-Su',
      currently_closed: false,
      general_manager: 'test-gm',
      notes: 'test-notes',
      day_of_week: 2
    },
    {
      id: 2,
      name: 'test-name2',
      location: 'test-location2',
      sales_rep_id: 1,
      company_id: 1,
      lat: null,
      lng: null,
      photo: '',
      hours_of_operation: 'Mo-Su',
      currently_closed: false,
      general_manager: 'test-gm2',
      notes: 'test-notes2',
      day_of_week: 2
    }
  ]
}

function seedClientsTables(db, users, clients) {
  return seedUsers(db, users)
    .then(() => 
      clients.length && db
        .into('client')
        .insert(clients)
    
    )
}
const maliciousReport = {
  id: 911,
  client_id: 1,
  sales_rep_id: 1,
  date: '2016-06-23T02:10:25.000Z',
  notes: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
}

const newReport = {

  client_id: 1,
  sales_rep_id: 1,
  date: '2016-06-23T02:10:25.000Z',
  notes: 'test notes',
}

function seedMaliciousReport(db, users, clients, report) {

  return seedClientsTables(db, users, clients)
    .then(() =>
      db.into('report').insert([report])
    )

}

function cleanTables(db) {
  return db.transaction(trx => 
    trx.raw(
      `TRUNCATE
        photo,
        report,
        client,
        users,
        myclientele_user,
        company`
    )
    .then(() => 
      Promise.all([
        trx.raw(`ALTER SEQUENCE photo_id_seq minvalue 0 START WITH 1`),
        trx.raw(`ALTER SEQUENCE report_id_seq minvalue 0 START WITH 1`),
        trx.raw(`ALTER SEQUENCE client_id_seq minvalue 0 START WITH 1`),
        trx.raw(`ALTER SEQUENCE myclientele_user_id_seq minvalue 0 START WITH 1`),
        trx.raw(`ALTER SEQUENCE company_id_seq minvalue 0 START WITH 1`),
        trx.raw(`SELECT setval('photo_id_seq', 0)`),
        trx.raw(`SELECT setval('report_id_seq', 0)`),
        trx.raw(`SELECT setval('client_id_seq', 0)`),
        trx.raw(`SELECT setval('myclientele_user_id_seq', 0)`),
        trx.raw(`SELECT setval('company_id_seq', 0)`),
      ])
    )
    )
}

module.exports = {
  makeKnexInstance,
  makeCompanyArray,
  makeTestUsers,
  makeAuthHeader,
  makeClientsAndReports,
  makeClients,
  seedMaliciousReport,
  maliciousReport,
  newReport,
  seedUsers,
  makeCompanyArray,
  seedCompanies,
  seedUsersClientsReports,
  seedClientsTables,
  cleanTables,
}