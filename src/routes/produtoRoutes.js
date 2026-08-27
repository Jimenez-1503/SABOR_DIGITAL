const express = require('express');
const router = express.Router();
const ProdutoController = require('../controllers/ProdutoController');
const upload = require('../config/multer');
const { verificarToken, verificarAdmin } = require('../middlewares/authMiddleware');

router.post('/', verificarToken, verificarAdmin, ProdutoController.cadastrar);
router.delete('/:id', verificarToken, verificarAdmin, ProdutoController.deletar);
router.get('/', ProdutoController.listar);
router.get('/:id', ProdutoController.buscarPorId);
router.post('/', upload.single('imagem'), ProdutoController.cadastrar);
router.put('/:id', upload.single('imagem'), ProdutoController.atualizar);
router.delete('/:id', ProdutoController.deletar);

module.exports = router;
