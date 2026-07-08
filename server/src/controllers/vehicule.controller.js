import model from '../models/vehicule.model.js';
import { vehiculeSchema, retraitSchema } from '../validators/vehicule.validator.js';

const getAll = async (req, res, next) => {
    try {
        res.json(await model.findAll());
    }catch(err){
        next(err);
    }
};

const getOne = async (req, res, next) => {
    try{
        const etablissement = await model.findById(req.params.id);
        if(!etablissement){
            return res.status(404).json({ message: 'vehicule introuvable' });
        }
        res.json(etablissement);
    }catch(err){
        next(err);
    }
};

const getRetires = async (req, res, next) => {
    try{
        const vehiculesRetires = await model.findRetires();
        res.json(vehiculesRetires);
    }catch(err){
        next(err);
    }
};

const getByContrat = async (req, res, next) => {
    try{
        const vehicules = await model.findByContrat(req.params.contratId);
        res.json(vehicules);
    }catch(err){
        next(err);
    }
};

const create = async (req, res, next) => {
    const {error ,value} = vehiculeSchema.validate(req.body, {abortEarly: false});
    if(error){
        return res.status(400).json({
            message: 'données invalides',
            details:error.details.map((d) => d.message),
        });
    }
    try{
        const created = await model.create(value);
        res.status(201).json(created);
    }catch(err){
        if(err.code === '23505'){
            return res.status(400).json({ message: 'immatriculation déjà utilisée' });
        }
        next(err);
    }
}
 
const update = async(req, res, next) => {
    const {error ,value}= vehiculeSchema.vehiculeSchema.validate(req.body, {abortEarly: false});
    if(error){
        return res.status(400).json({
            message: 'données invalide',
            details: error.details.map((d) => d.message),
        })
    }
    try{
        const updated= await model.update(req.params.id, value);
        if(!updated){
            res.status(404).json({ message: 'vehicule introuvable' });
        }
        res.json(updated);
    }catch(err){
        if(err.code === '23505'){
            return res.status(400).json({ message: 'immatriculation déjà utilisée' });
        }
        next(err);
    }
};

const retirer = async(req, res,next) =>{
    const { error, value } = retraitSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({
            message: 'données invalides',
            details: error.details.map((d) => d.message),
        });
    }
    try {
        const retire = await model.retirer(req.params.id, value.motif_retrait);
        if (!retire) {
            return res.status(404).json({ message: 'vehicule introuvable ou déjà retiré' });
        }  
        res.json(retire);
    } catch (err) {
        next(err);
    }
};

const restaurer = async(req, res,next) =>{
    try {
        const restaure = await model.restaurer(req.params.id);
        if (!restaure) {
            return res.status(404).json({ message: 'vehicule introuvable ou déjà actif' });
        }
        res.json(restaure);
    } catch (err) {
        next(err);
    }
};

export default { getAll, getOne, getRetires, getByContrat, create, update, retirer, restaurer };