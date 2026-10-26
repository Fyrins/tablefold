/**
 * Tablefold - editor integration.
 *
 * Adds two attributes to the core table block and the controls that drive them.
 *
 * Nothing is written into the saved markup. The attributes have no `source`, so
 * they live in the block comment, which block validation ignores. Adding a class
 * through `blocks.getSaveContent.extraProps` would be safe on activation, since
 * an absent attribute falls back to its default and produces identical markup,
 * but it would invalidate every styled table on deactivation: the saved markup
 * would carry a class the regenerated markup no longer has. The classes are
 * therefore added on the server, in the `render_block` filter.
 */

import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody, SelectControl, ToggleControl } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';

import './style.scss';

const TARGET_BLOCK = 'core/table';

const settings = window.tablefoldEditor || {};
const breakpoints = Array.isArray( settings.breakpoints ) ? settings.breakpoints : [];
const defaultBreakpoint = settings.defaultBreakpoint || '600';

/**
 * Declares the two attributes on the table block.
 *
 * Both have a default, so a block that was saved before the plugin was
 * installed keeps producing byte-identical markup.
 *
 * @param {Object} blockSettings Block settings being registered.
 * @param {string} name          Block name.
 * @return {Object} Block settings, with the plugin attributes added.
 */
function addAttributes( blockSettings, name ) {
	if ( TARGET_BLOCK !== name ) {
		return blockSettings;
	}

	return {
		...blockSettings,
		attributes: {
			...blockSettings.attributes,
			tablefold: {
				type: 'boolean',
				default: false,
			},
			tablefoldBreakpoint: {
				type: 'string',
				default: defaultBreakpoint,
			},
		},
	};
}

/**
 * Adds the inspector panel to the table block.
 *
 * Uses the standard components, each with an explicit label and help text, so
 * the controls inherit the editor's own accessibility behaviour.
 */
const withTablefoldControls = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		if ( TARGET_BLOCK !== props.name || ! props.isSelected ) {
			return <BlockEdit { ...props } />;
		}

		const { attributes, setAttributes } = props;
		const isEnabled = !! attributes.tablefold;

		return (
			<>
				<BlockEdit { ...props } />
				<InspectorControls>
					<PanelBody title={ __( 'Small screen display', 'tablefold' ) } initialOpen={ false }>
						<ToggleControl
							__nextHasNoMarginBottom
							label={ __( 'Stack on small screens', 'tablefold' ) }
							checked={ isEnabled }
							help={ __(
								'Below the chosen width, each row is shown as a card and every cell is preceded by its column name, instead of the table scrolling sideways. Needs a header row and no merged cells; a table that does not qualify keeps horizontal scrolling.',
								'tablefold',
							) }
							onChange={ ( value ) => setAttributes( { tablefold: value } ) }
						/>
						{ isEnabled && breakpoints.length > 0 && (
							<SelectControl
								__nextHasNoMarginBottom
								__next40pxDefaultSize
								label={ __( 'Stack below', 'tablefold' ) }
								value={ attributes.tablefoldBreakpoint || defaultBreakpoint }
								options={ breakpoints }
								help={ __(
									'Screen width under which the table switches to the stacked layout.',
									'tablefold',
								) }
								onChange={ ( value ) =>
									setAttributes( {
										tablefoldBreakpoint: value,
									} )
								}
							/>
						) }
					</PanelBody>
				</InspectorControls>
			</>
		);
	},
	'withTablefoldControls',
);

addFilter( 'blocks.registerBlockType', 'tablefold/attributes', addAttributes );
addFilter( 'editor.BlockEdit', 'tablefold/controls', withTablefoldControls );
