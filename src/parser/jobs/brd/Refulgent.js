import React, {Fragment} from 'react'

import Module from 'parser/core/Module'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'

import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'

/**
 * Analyzer for Refulgent Arrow usage. Includes a suggestion for hitting your
 * buttons when they light up.
 */
export default class Refulgent extends Module {
	static handle = 'refulgent'
	static title = 'Refulgent Arrow'

	static dependencies = [
		'suggestions',
	]

	_numBuffs = 0
	_numCasts = 0

	constructor(...args) {
		super(...args)

		const refulgentFilter = {
			by: 'player',
			abilityId: ACTIONS.REFULGENT_ARROW.id,
		}

		const straighterFilter = {
			by: 'player',
			abilityId: STATUSES.STRAIGHTER_SHOT.id,
		}

		this.addHook('applybuff', straighterFilter, this._onBuff)
		this.addHook('refreshbuff', straighterFilter, this._onBuff)
		this.addHook('cast', refulgentFilter, this._onRefulgent)

		this.addHook('complete', this._onComplete)
	}

	_onBuff() {
		this._numBuffs++
	}

	_onRefulgent() {
		// TODO: it'd be nice to determine if a proc was dropped or used on an
		//       autocrit; could calculate potency lost then
		this._numCasts++
	}

	_onComplete() {
		if (this._numCasts < this._numBuffs) {
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.REFULGENT_ARROW.icon,
				content: <Fragment>
					Don't let Refulgent Arrow procs pass you by! You may find situations where it's best to refresh Straight Shot instead of cast Refulgent, but you can avoid putting yourself in those positions with some discipline and foresight.
				</Fragment>,
				severity: SEVERITY.MAJOR,
				why: <Fragment>
					{(this._numBuffs - this._numCasts)} additional Refulgent Arrows could have been casted.
				</Fragment>,
			}))
		}
	}
}
