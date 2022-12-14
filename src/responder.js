"use strict";
/*!
 * Express Rest Response (https://github.com/dimtrovich/express-responder)
 * Copyright 2021 Dimtrov Lab's | Dimitri Sitchet Tomkeu
 * Licensed under MIT (https://opensource.org/licences/mit)
 */
import StatusCode from "./status";
import { empty, is_array, is_object } from './utils';

/**
 * Constructeur de reponse 
 * 
 * @param {*} res 
 * @param {*} options 
 * @param {*} codes 
 * @returns 
 */
export default function (res, options, codes) {
	const _res = res;

	/**
     * Permet aux classes enfants de remplacer
     * code d'état utilisé dans leur API.
     *
     * @var array<string, int>
     */
	const defaultCodes = {
        created                  : StatusCode.CREATED,
        deleted                  : StatusCode.OK,
        updated                  : StatusCode.OK,
        no_content               : StatusCode.NO_CONTENT,
        invalid_request          : StatusCode.BAD_REQUEST,
        unsupported_response_type: StatusCode.BAD_REQUEST,
        invalid_scope            : StatusCode.BAD_REQUEST,
        temporarily_unavailable  : StatusCode.BAD_REQUEST,
        invalid_grant            : StatusCode.BAD_REQUEST,
        invalid_credentials      : StatusCode.BAD_REQUEST,
        invalid_refresh          : StatusCode.BAD_REQUEST,
        no_data                  : StatusCode.BAD_REQUEST,
        invalid_data             : StatusCode.BAD_REQUEST,
        access_denied            : StatusCode.UNAUTHORIZED,
        unauthorized             : StatusCode.UNAUTHORIZED,
        invalid_client           : StatusCode.UNAUTHORIZED,
        forbidden                : StatusCode.FORBIDDEN,
        resource_not_found       : StatusCode.NOT_FOUND,
        not_acceptable           : StatusCode.NOT_ACCEPTABLE,
        resource_exists          : StatusCode.CONFLICT,
        conflict                 : StatusCode.CONFLICT,
        resource_gone            : StatusCode.GONE,
        payload_too_large        : StatusCode.PAYLOAD_TOO_LARGE,
        unsupported_media_type   : StatusCode.UNSUPPORTED_MEDIA_TYPE,
        too_many_requests        : StatusCode.TOO_MANY_REQUESTS,
        server_error             : StatusCode.INTERNAL_ERROR,
        unsupported_grant_type   : StatusCode.NOT_IMPLEMENTED,
        not_implemented          : StatusCode.NOT_IMPLEMENTED,
	};
	const _codes = {...defaultCodes, ...codes};

	const defaultOptions = {
		/**
		 * Specifie si on doit utiliser le mode strict (envoi des codes HTTP appropries pour la reponse)
		 * Si défini à FALSE, toutes les reponses auront le statut 200, seul le champ code changera
		 * 
		 * @var {Boolean}
		 */
		strict: true,

		/**
		 * @var {[key: string]: string}
		 */
		field: {
			/**
			 * Le nom du champ pour `l'etat` de la réponse
			 */
		 	success: 'success',
			/**
			 * Le nom du champ pour le 'message' dans la réponse
			 */
			message: 'message',
			/**
			 * Le nom du champ pour le 'code' dans la réponse
			 */
		 	code: 'code',
			/**
			 * Le nom du champ pour les 'erreurs' dans la réponse
			 */
		 	errors: 'errors',
			/**
			 * Le nom du champ pour les 'resultats' dans la réponse
			 */
		 	result: 'result'
	 	},
	};
	const _options = {...defaultOptions, ...options};


	/**
	 * @internal
	 */
	const _parseParams = (message, code = null, errors = []) => {
		if (is_array(message) || is_object(message)) {
			if (empty(errors)) {
				errors = message;
			}
			message = null;
		}
		if (is_array(code)) {
			if (empty(errors)) {
				errors = code;
			}
			code = null;
		}

		return {message, code, errors}
	}


	return {
		/**
		 * Utilisé pour les échecs génériques pour lesquels aucune méthode personnalisée n'existe.
		 *
		 * @param {String}         		message Le message décrivant l'erreur
		 * @param {number}     			status  Code d'état HTTP
		 * @param {number|string|null} 	code    Code d'erreur personnalisé, spécifique à l'API
		 * @param {Array}           	errors  La liste des erreurs rencontrées
		 */
		respondFail(message = "An error has occurred", status = StatusCode.INTERNAL_ERROR, code, errors = []) {
			message = message || "Une erreur s'est produite";
			code = !empty(code) ? code : status;
			
			const response = {};
			
			response[_options.field?.message || 'message'] = message;
			
			if (!empty(_options.field?.success)) {
				response[_options.field?.success] = false;
			}
			if (!empty(_options.field?.code)) {
				response[_options.field?.code] =code;
			}
			if (!empty(errors)) {
				response[_options.field?.errors || 'errors'] = errors;
			}
			
			if (_options.strict !== true) {
				status = StatusCode.OK;
			}
			
			return this.respond(response, status);
		},

		/**
		 * Utilisé pour les succès génériques pour lesquels aucune méthode personnalisée n'existe.
		 */
		respondSuccess(message = "Result", result = null, status = StatusCode.OK) {
			message = message || 'Résultat';
			status = !empty(status) ? status : StatusCode.OK;

			const response = {};
			
			response[_options.field?.message || 'message'] = message;
			
			if (!empty(_options.field?.success)) {
				response[_options.field?.success] = true;
			}
			
			response[_options.field?.result || 'result'] = result;
			
			return this.respond(response, status);
		},

		/**
		 * Fournit une méthode simple et unique pour renvoyer une réponse d'API, formatée
		 * pour correspondre au format demandé, avec le type de contenu et le code d'état appropriés.
		 *
		 * @param {*}    		data   Les donnees a renvoyer
		 * @param {number|null} status Le statut de la reponse
		 */
		respond(data, status = StatusCode.OK) {
			// Si les données sont NULL et qu'aucun code d'état HTTP n'est fourni, affichage, erreur et sortie
			if ((empty(data)) && status === null) {
				status = StatusCode.NOT_FOUND;
			}
			data = JSON.parse(JSON.stringify(data));
			return _res.status(status || 200).json(data);
		},


		/**
		 * Reponse de type bad request
		 */
		respondBadRequest(message, code = null, errors = []) {
			const params = _parseParams(message, code, errors);
			
			return this.respondFail(params.message || 'Bad request', _codes.invalid_request || StatusCode.BAD_REQUEST, params.code, params.errors);
		},

		/**
		 * À utiliser lorsque vous essayez de créer une nouvelle ressource et qu'elle existe déjà.
		 */
		respondConflict(message, code = null, errors = []) {
			const params = _parseParams(message, code, errors);

			return this.respondFail(params.message || 'Conflict', _codes.conflict || StatusCode.CONFLICT, params.code, params.errors);
		},

		/**
		 * Utilisé après la création réussie d'une nouvelle ressource.
		 */
		respondCreated(message, result = null) {
			const params = _parseParams(message, null, result);

			return this.respondSuccess(params.message || 'Created', params.errors, _codes.created || StatusCode.CREATED);
		},

		/**
		 * Utilisé après qu'une ressource a été supprimée avec succès.
		 */
		respondDeleted(message, result = null) {
			const params = _parseParams(message, null, result);

			return this.respondSuccess(params.message || 'Deleted', params.errors, _codes.deleted || StatusCode.OK);
		},

		/**
		 * Utilisé lorsque l'accès est toujours refusé à cette ressource
		 * et qu'aucune nouvelle tentative n'aidera.
		 */
		respondForbidden(message, code = null, errors = []) {
			const params = _parseParams(message, code, errors);

			return this.respondFail(params.message || 'Forbidden', _codes.forbidden || StatusCode.FORBIDDEN, params.code, params.errors);
		},

		/**
		 * À utiliser lorsqu'une ressource a été précédemment supprimée. Ceci est différent de Not Found,
		 * car ici, nous savons que les données existaient auparavant, mais sont maintenant disparues,
		 * où Not Found signifie que nous ne pouvons tout simplement pas trouver d'informations à leur sujet.
		 */
		respondGone(message, code = null, errors = []) {
			const params = _parseParams(message, code, errors);

			return this.respondFail(params.message || 'Gone', _codes.resource_gone || StatusCode.GONE, params.code, params.errors);
		},

		/**
		 * Utilisé lorsqu'il y a une erreur de serveur.
		 */
		respondInternalError(message, code = null, errors = []) {
			const params = _parseParams(message, code, errors);

			return this.respondFail(params.message || 'Internal Server Error', _codes.server_error || StatusCode.INTERNAL_ERROR, params.code, params.errors);
		},

		/**
		 * Reponse de type invalid token
		 */
		respondInvalidToken(message, code = null) {
			const params = _parseParams(message, code, []);

			return this.respondFail(params.message || 'Invalid Token', _codes.invalid_token || StatusCode.INVALID_TOKEN, params.code, params.errors);
		},

		/**
		 * Reponse de type method not allowed
		 */
		respondMethodNotAllowed(message, code = null, errors = []) {
			const params = _parseParams(message, code, errors);

			return this.respondFail(params.message || 'Method Not Allowed', _codes.not_allowed || StatusCode.METHOD_NOT_ALLOWED, params.code, params.errors);
		},

		/**
		 * Utilisé après qu'une commande a été exécutée avec succès
		 * mais qu'il n'y a pas de réponse significative à renvoyer au client.
		 */
		respondNoContent(message) {
			return this.respondSuccess(message || 'No Content', null, _codes.no_content || StatusCode.NO_CONTENT);
		},

		/**
		 * Reponse de type not acceptable
		 */
		respondNotAcceptable(message, code = null, errors = []) {
			const params = _parseParams(message, code, errors);

			return this.respondFail(params.message || 'Not Acceptable', _codes.not_acceptable || StatusCode.NOT_ACCEPTABLE, params.code, params.errors);
		},

		/**
		 * Utilisé lorsqu'une ressource spécifiée est introuvable.
		 */
		respondNotFound(message, code = null, errors = []) {
			const params = _parseParams(message, code, errors);

			return this.respondFail(params.message || 'Not Found', _codes.resource_not_found || StatusCode.NOT_FOUND, params.code, params.errors);
		},

		/**
		 * Reponse de type not implemented
		 */
		respondNotImplemented(message, code = null) {
			const params = _parseParams(message, code, []);

			return this.respondFail(params.message || 'Not Implemented', _codes.resource_not_implemented || StatusCode.NOT_IMPLEMENTED, params.code, params.errors);
		},

		/**
		 * Reponse de type ok
		 */
		respondOk(message, result = null) {
			const params = _parseParams(message, null, result);

			return this.respondSuccess(params.message || 'Ok', params.errors, _codes.ok || StatusCode.OK);
		},

		/**
		 * Utilisé lorsque l'utilisateur a fait trop de demandes pour la ressource récemment.
		 */
		respondTooManyRequests(message, code = null, errors = []) {
			const params = _parseParams(message, code, errors);

			return this.respondFail(params.message || 'Too Many Requests', _codes.too_many_requests || StatusCode.TOO_MANY_REQUESTS, params.code, params.errors);
		},

		/**
		 * Utilisé lorsque le client n'a pas envoyé d'informations d'autorisation
		 * ou avait de mauvaises informations d'identification d'autorisation.
		 * L'utilisateur est encouragé à réessayer avec les informations appropriées.
		 */
		respondUnauthorized(message, code = null, errors = []) {
			const params = _parseParams(message, code, errors);

			return this.respondFail(params.message || 'Unauthorized', _codes.unauthorized || StatusCode.UNAUTHORIZED, params.code, params.errors);
		},

		/**
		 * Utilisé après qu'une ressource a été mise à jour avec succès.
		 */
		respondUpdated(message, result = null) {
			const params = _parseParams(message, null, result);

			return this.respondSuccess(params.message || 'Updated', params.errors, _codes.updated || StatusCode.OK);
		},
	}
}
