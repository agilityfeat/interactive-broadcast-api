import express from 'express';
import validate from 'express-validation';

const router = express.Router(); // eslint-disable-line new-cap
const Viewer = require('../services/viewer');
const getAPIResponse = require('../helpers/APIResponse');
const { checkAdmin } = require('../middleware/validation');
const paramValidation = require('../../config/param-validation');

const getViewers = getAPIResponse(req => Viewer.getViewers(req.params.domainId), { skipNotFoundValidation: true });
const getViewerById = getAPIResponse(req => Viewer.getViewer(req.params.domainId, req.params.id));
const createViewer = getAPIResponse(req => Viewer.createViewer(req.body));
const deleteViewer = getAPIResponse(req => Viewer.deleteViewer(req.params.domainId, req.params.id));
const sendResetPassword = getAPIResponse(req => Viewer.sendResetPassword(req.body.userUrl, req.body.domainId, req.body.email));
const resetPassword = getAPIResponse(req => Viewer.resetPassword(req.body.token, req.body.password));

router.post('/', validate(paramValidation.createViewer), createViewer);
router.post(
  '/send-reset-password',
  validate(paramValidation.sendResetPassword),
  sendResetPassword
);
router.post('/reset-password', validate(paramValidation.resetPassword), resetPassword);
router.get('/:domainId', checkAdmin, getViewers);
router.get('/:domainId/:id', getViewerById);
router.delete('/:domainId/:id', checkAdmin, deleteViewer);

export default router;
