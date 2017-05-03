#!/bin/env node

'use strict';

let LunchHunter = function() {
	let $          = require( 'cheerio' ),
	    _          = require( 'underscore' ),
	    request    = require( 'request' ),
	    util       = require( 'util' ),
	    Slack      = require( 'node-slack' ),
	    async      = require( 'async' ),
	    schoolDays = [ 1, 2, 3, 4, 5 ], // 1 is Monday, 2 Tuesday, 3 Wednesday
	    cafeterias = [
		    {
			    name: 'Mensa',
			    url:  'http://hochschule-rapperswil.sv-restaurant.ch/de/menuplan/mensa/'
		    },
		    {
			    name: 'Forschungszentrum',
			    url:  'http://hochschule-rapperswil.sv-restaurant.ch/de/menuplan/forschungszentrum/'
		    }
	    ];

	String.prototype.replaceAll = function( search, replacement ) {
		let target = this;

		return target.replace( new RegExp( search, 'g' ), replacement );
	};

	let getOffers = function( html ) {
		let results = [], offers = $.load( html )( '#menu-plan-tab1 .menu-item .item-content' );

		let prepareDescription = function( string ) {
			return removeWhitespace( string ).replaceAll( 'Regular CHF 8.00/10.60', '' ).replaceAll( 'Small CHF 6.00/8.00', '' ).replaceAll( ' Zubereitungszeit', '. Zubereitungszeit' );
		};

		let removeWhitespace = function( string ) {
			return string.replaceAll( "\n", ' ' ).replaceAll( "\t", '' ).replaceAll( ',', ', ' ).replaceAll( '  ', ' ' ).trim();
		};

		_.each( offers, function( offer ) {
			results.push(
				{
					title:       removeWhitespace( $( offer ).find( '.menu-title' ).text() ),
					description: prepareDescription( $( offer ).find( '.menu-description' ).text() ),
				}
			)
		} );

		return results;
	};

	let postToSlack = function( cafeteria, offers, callback ) {
		let slack = new Slack( process.env.CAFETERIA_SLACK_URL );

		let fields = function() {
			let results = [];
			_.each( offers, function( offer ) {
				results.push(
					{
						'title': offer.title,
						'value': offer.description,
						'short': true,
					}
				);
			} );

			return results;
		}();

		console.log( 'Posting to Slack...' );

		slack.send(
			{
				text:        {
					toString: function() {
						return ''
					}
				},
				username:    'LunchHunter',
				icon_emoji:  ':fork_and_knife:',
				attachments: [ {
					'title':    cafeteria.name,
					'fallback': 'Bald ist Essenszeit!',
					'color':    "#7CD197",
					'fields':   fields
				} ]
			},
			{
				call: function( res, err, body ) {
					let msg = err ? err.message : null;
					callback( msg, body );
				}
			}
		);
	};

	let checkCafeteria = function( cafeteria, callback ) {
		request( cafeteria.url, function( err, response, body ) {
			console.log( util.format( 'Fetching menu for %s...', cafeteria.name ) );
			if ( !err && response.statusCode === 200 ) {
				// Get offers from page
				let offers = getOffers( body );

				console.log( util.format( 'Found %d offers!', offers.length ) );

				// Post them in Slack
				postToSlack( cafeteria, offers, callback );

			} else {
				callback( "There was an error while fetching the menu :(\n" );
			}
		} );
	};

	let runBoyRun = function( callback ) {
		async.each( cafeterias, checkCafeteria, function( err ) {
			callback( err, 'Done' );
		} );
	};

	return {
		run: function( callback ) {
			if ( _.contains( schoolDays, new Date().getDay() ) ) {
				console.log( "Let's see what we're going to eat today!\n" );
				runBoyRun( callback );
			} else {
				callback( 'No school day, nothing to do here...' );
			}
		}
	}
};

module.exports = LunchHunter;