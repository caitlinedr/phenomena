const { Client } = require('pg');

const client = new Client(process.env.DATABASE_URL || 'postgres:localhost:5432/phenomena-dev');

/**
 * Report Related Methods
 */

async function getOpenReports() {
  try {
    const { rows: reports } = await client.query(`
      SELECT *
      FROM reports
      WHERE "isOpen"=$1;
    `, [true]);

    const reportIds = reports.map((report) => report.id).join(', ')
    
    const { rows: comments } = await client.query(`
      SELECT *
      FROM comments
      WHERE "reportId" IN (${reportIds});
    `)
  
    reports.forEach((report) => {
      const reportComments = comments.filter((comment) => comment.reportId === report.id)

      report.comments = reportComments

      report.isExpired = Date.parse(report.expirationDate) < new Date()

      delete report.password
    })
  
    return reports;

  } catch (error) {
    throw error;
  }
}

async function createReport(reportFields) {
  const {
    title,
    location,
    description,
    password,
  } = reportFields

  try {
    const { rows: [report] } = await client.query(`
      INSERT INTO reports(title, location, description, password)
      VALUES($1, $2, $3, $4)
      ON CONFLICT (id) DO NOTHING
      RETURNING *;
    `, [title, location, description, password]);

    delete report.password;

    return report;

  } catch (error) {
    throw error;
  }
}

async function _getReport(reportId) {

  try {
    const { rows: [report] } = await client.query(`
      SELECT *
      FROM reports
      WHERE id=${ reportId } 
    `)

    return report;

  } catch (error) {
    throw error;
  }
}


async function closeReport(reportId, password) {
  try {
    const report = await _getReport(reportId)

    if(!report) {
      throw new Error("Report does not exist with that id")
    }
  
    if(report.password !== password) {
      throw new Error("Password incorrect for this report, please try again")
  
    }

    if(!report.isOpen) {
      throw new Error("This report has already been closed")
    }
    
    if(report) {
        await client.query(`
          UPDATE reports
          SET "isOpen" = 'false'
          WHERE id=${ reportId }
        `);
      return {message: "Report successfully closed!"}
    }
    
  } catch (error) {
    throw error;
  }
}

/**
 * Comment Related Methods
 */

async function createReportComment(reportId, commentFields) {
  const { content } = commentFields
  
  try {
    const report = await _getReport(reportId)

    if(!report) {
      throw new Error('That report does not exist, no comment has been made')
    }

    if(!report.isOpen) {
      throw new Error('That report has been closed, no comment has been made')
    }

    if(Date.parse(report.expirationDate) < new Date()) {
      throw new Error('The discussion time on this report has expired, no comment has been made')
    }
    
      const { rows: [comment] } = await client.query(`
      INSERT INTO comments(content, "reportId")
      VALUES ($1, $2)
      RETURNING *;
    `, [content, reportId]);
    
    await client.query(`
    UPDATE reports
    SET "expirationDate" = CURRENT_TIMESTAMP + interval '1 day' 
    WHERE id=${reportId}
    `)
  
    return comment

  } catch (error) {
    throw error;
  }
}

module.exports = {
  client,
  getOpenReports,
  createReport,
  _getReport,
  closeReport,
  createReportComment
}