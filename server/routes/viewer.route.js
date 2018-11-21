import express from 'express';
import validate from 'express-validation';

const router = express.Router(); // eslint-disable-line new-cap
const Viewer = require('../services/viewer');
const getAPIResponse = require('../helpers/APIResponse');
const { checkAdmin } = require('../middleware/validation');
const paramValidation = require('../../config/param-validation');

const getViewers = getAPIResponse(req => Viewer.getViewers(req.params.adminId), { skipNotFoundValidation: true });
const getViewerById = getAPIResponse(req => Viewer.getViewer(req.params.adminId, req.params.id));
const createViewer = getAPIResponse(req => Viewer.createViewer(req.body));
const deleteViewer = getAPIResponse(req => Viewer.deleteViewer(req.params.adminId, req.params.id));

router.post('/', validate(paramValidation.createViewer), createViewer);
router.get('/:adminId', checkAdmin, getViewers);
router.get('/:adminId/:id', getViewerById);
router.delete('/:adminId/:id', checkAdmin, deleteViewer);

export default router;
