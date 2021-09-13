const express = require('express');
const apiRouter = express.Router();

const { getOpenReports, createReport, closeReport, createReportComment } = require('../db')

apiRouter.get('/reports', async (req, res, next) => {

    try {
        const reports = await getOpenReports()
        
        res.send({
            reports
        });

        } catch (error) {
            next(error)
        } 
});

apiRouter.post('/reports', async (req, res, next) => {
    try {
        const report = await createReport(req.body)

        res.send(report)

    } catch (error) {
        next(error)
    }
})

apiRouter.delete('/reports/:reportId', async(req, res, next) => {
    const { reportId } = req.params
    const { password } = req.body

    try {
        const report = await closeReport(reportId, password)

        res.send(report)
    } catch (error) {
        next(error)
    }
})

 apiRouter.post('/reports/:reportId/comments', async (req, res, next) => {
     const { content } = req.body
     const { reportId } = req.params
    try {
        const reportComment = await createReportComment(reportId, {content})

        res.send(reportComment)

    } catch (error) {
        next(error)
    }
})

module.exports = apiRouter;
