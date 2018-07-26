import React, {Fragment} from 'react'
import {ActionLink} from 'components/ui/DbLink'

import Module from 'parser/core/Module'
import {Rule, Requirement} from 'parser/core/modules/Checklist'
import {Suggestion, SEVERITY} from 'parser/core/modules/Suggestions'

import ACTIONS from 'data/ACTIONS'
import STATUSES from 'data/STATUSES'

/**
 * Analyzer for Straight Shot usage. Includes a checklist item for buff uptime
 * and a suggestion for early reapplications. Straighter Shot usage is handled
 * in the Refulgent Arrow module.
 */
export default class StraightShot extends Module {
	static handle = 'straightShot'
	static title = 'Straight Shot'

	static dependencies = [
		'checklist',
		'combatants',
		'invuln',
		'suggestions',
	]

	SS_DURATION = 30000
	SS_BUFFER = 10000

	_allApplications = []
	_numEarlies = 0

	constructor(...args) {
		super(...args)

		const filter = {
			by: 'player',
			abilityId: STATUSES.STRAIGHT_SHOT.id,
		}

		this.addHook('applybuff', filter, this._onApply)
		this.addHook('refreshbuff', filter, this._onApply)
		this.addHook('complete', this._onComplete)
	}

	_onApply(event) {
		this._allApplications.unshift(event)

		if (this._allApplications.length < 2) {
			return
		}

		const current = this._allApplications[0].timestamp
		const previous = this._allApplications[1].timestamp
		const timeSinceLastApply = current - previous

		if (timeSinceLastApply < this.SS_DURATION - this.SS_BUFFER) {
			this._numEarlies++
		}
	}

	_onComplete() {
		this.checklist.add(new Rule({
			name: 'Keep Straight Shot up',
			description: 'Critical hits increase your damage and give you more song procs. Straight Shot is one of the pillars of Bard damage.',
			requirements: [
				new Requirement({
					name: <Fragment><ActionLink {...ACTIONS.STRAIGHT_SHOT} /> uptime</Fragment>,
					percent: () => this.getUptimePercent(),
				}),
			],
		}))

		if (this._numEarlies) {
			// maybe change the `why` to clip time? but we expect clipping to
			// occur anyway, so perhaps just clipping beyond the buffer?
			this.suggestions.add(new Suggestion({
				icon: ACTIONS.STRAIGHT_SHOT.icon,
				content: <Fragment>
					Avoid refreshing {ACTIONS.STRAIGHT_SHOT.name} significantly before its expiration - not only is it lower potency than {ACTIONS.HEAVY_SHOT.name}, but you miss out on potential {ACTIONS.REFULGENT_ARROW.name} procs.
				</Fragment>,
				severity: SEVERITY.MINOR,
				why: <Fragment>
					{this._numEarlies} reapplications that were {this.SS_BUFFER / 1000} or more seconds before expiration.
				</Fragment>,
			}))
		}
	}

	/**
	 * Gets the uptime percent on the player's Straight Shot status. Discounts
	 * invulnerability periods.
	 */
	getUptimePercent() {
		const statusUptime = this.combatants.getStatusUptime(STATUSES.STRAIGHT_SHOT.id, this.parser.player.id)
		const fightUptime = this.parser.fightDuration - this.invuln.getInvulnerableUptime()

		return (statusUptime / fightUptime) * 100
	}
}
