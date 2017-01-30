import React from 'react';
import {
	View,
	Dimensions,
	ScrollView,
	Text,
	StyleSheet,
	TouchableOpacity,
	Switch
} from 'react-native';
import { connect } from 'react-redux';
import ElevatedView from 'react-native-elevated-view';
import SideMenu from 'react-native-side-menu';
import Icon from 'react-native-vector-icons/FontAwesome';
import MapView from 'react-native-maps';

import SearchSideMenu from './SearchSideMenu';
import SearchBar from './SearchBar';
import SearchMap from './SearchMap';
import SearchResults from './SearchResults';
import SearchHistoryCard from './SearchHistoryCard';
import NearbyService from '../../services/nearbyService';
import ShuttleLocationContainer from '../../containers/shuttleLocationContainer';

import { toggleRoute } from '../../actions/shuttle';
import { saveSearch } from '../../actions/map';

const css = require('../../styles/css');
const logger = require('../../util/logger');
const shuttle = require('../../util/shuttle');
const AppSettings = 		require('../../AppSettings');

import general, { getPRM } from '../../util/general';

let navBarMarginTop = 64;
let searchMargin = navBarMarginTop;

if (general.platformAndroid()) {
	navBarMarginTop = 64;
	searchMargin = 0;
}

const deviceHeight = Dimensions.get('window').height;
const deviceWidth = Dimensions.get('window').width;

const MAXIMUM_HEIGHT = deviceHeight - navBarMarginTop;
const MINUMUM_HEIGHT = navBarMarginTop;

const shuttle_stops = require('../../json/shuttle_stops_master_map.json');
const shuttle_routes = require('../../json/shuttle_routes_master_map.json');

class NearbyMapView extends React.Component {

	constructor(props) {
		super(props);

		this.state = {
			searchInput: null,
			searchResults: null,
			selectedResult: null,
			sliding: false,
			typing: false,
			allowScroll: false,
			iconStatus: 'menu',
			showBar: true,
			showMenu: false,
			toggled: false,
			vehicles: {}
		};
	}

	componentWillMount() {
		Object.keys(shuttle_routes).forEach((key, index) => {
			this.setState({ ['route' + key] : false });
		});
	}

	componentWillReceiveProps(nextProps) {
		// Loop thru every vehicle
		Object.keys(nextProps.vehicles).forEach((key, index) => {
			if (this.state.vehicles[key]) {
				nextProps.vehicles[key].forEach((nextVehicle) => {
					this.state.vehicles[key].forEach((currVehicle) => {
						if (nextVehicle.id === currVehicle.id &&
							(nextVehicle.lat !== currVehicle.lat || nextVehicle.lon !== currVehicle.lon)) {
							currVehicle.animated.timing({
								latitude: nextVehicle.lat,
								longitude: nextVehicle.lon,
								duration: 500
							}).start();
						}
					});
				});
			} else {
				// Make Animated values
				nextProps.vehicles[key].forEach((nextVehicle) => {
					nextVehicle.animated = new MapView.AnimatedRegion({
						latitude: nextVehicle.lat,
						longitude: nextVehicle.lon,
					});
				});

				const newVehicles = this.state.vehicles;
				newVehicles[key] = nextProps.vehicles[key];

				this.setState({
					vehicles: newVehicles
				});
			}
		});
	}

	shouldComponentUpdate(nextProps, nextState) {
		// Don't re-render if location hasn't changed
		if (((this.props.location.coords.latitude !== nextProps.location.coords.latitude) ||
			(this.props.location.coords.longitude !== nextProps.location.coords.longitude)) ||
			this.state !== nextState) {
			/*
			(this.state.selectedResult !== nextState.selectedResult) ||
			(this.state.iconStatus !== nextState.iconStatus) ||
			(this.state.showBar !== nextState.showBar) ||
			(this.state.showMenu !== nextState.showMenu) ||
			(this.state.route1 !== nextState.route1)) {*/

			return true;
		} else {
			return false;
		}
	}

	pressIcon = () => {
		if (this.state.iconStatus === 'back') {
			this.setState({
				iconStatus: 'menu',
				showBar: true
			});
			this.scrollRef.scrollTo({ x: 0, y: 0, animated: true });
			// this.barRef.clear();
			this.barRef.blur();
		} else if (this.state.iconStatus === 'menu') {
			this.updateMenuState(true);
		}
	}

	pressHistory = (text) => {
		this.pressIcon();
		this.updateSearch(text);
	}

	gotoResults = () => {
		this.setState({
			iconStatus: 'back',
			showBar: false
		});
		this.scrollRef.scrollTo({ x: 0, y: (deviceHeight - Math.round(44 * getPRM())) + 6, animated: true });
	}

	focusSearch = () => {
		this.scrollRef.scrollTo({ x: 0, y: (2 * deviceHeight) - Math.round(2 * 44 * getPRM()) - 12, animated: true });
		this.setState({
			iconStatus: 'back',
			showBar: false
		});
	}

	updateSearch = (text) => {
		this.pressIcon();
		NearbyService.FetchSearchResults(text).then((result) => {
			if (result.results) {
				this.setState({
					searchInput: text,
					searchResults: result.results,
					selectedResult: result.results[0],
					showBar: true
				});
				this.props.dispatch(saveSearch(text));  // Save search term
			} else {
				this.setState({
					searchInput: 'No Results, please try a different term',
					searchResults: null,
					selectedResult: null,
					showBar: false
				});
			}
		});
	}

	updateSelectedResult = (index) => {
		const newSelect = this.state.searchResults[index];
		this.setState({
			iconStatus: 'menu',
			selectedResult: newSelect,
			showBar: true
		});
		this.scrollRef.scrollTo({ x: 0, y: 0, animated: true });
	}

	updateMenuState = (showMenu) => {
		this.setState({ showMenu, });
	}

	toggleRoute = (value, route) => {
		this.props.dispatch(toggleRoute(route));

		const vehicles = this.state.vehicles;
		delete vehicles[route];

		this.setState({
			toggled: !this.state.toggled,
			vehicles });
	}

	render() {
		if (this.props.location.coords) {
			return (
				<SideMenu
					menu={
						<SearchSideMenu
							shuttle_routes={shuttle_routes}
							onToggle={this.toggleRoute}
							toggles={this.props.toggles}
						/>
					}
					isOpen={this.state.showMenu}
					onChange={(isOpen) => this.updateMenuState(isOpen)}
				>
					<View style={css.main_container}>
						<View
							// Only necessary for ios?
							style={{
								zIndex: 1
							}}
						>
							<SearchBar
								update={this.updateSearch}
								onFocus={this.focusSearch}
								pressIcon={this.pressIcon}
								iconStatus={this.state.iconStatus}
								searchInput={this.state.searchInput}
								reff={
									(ref) => { this.barRef = ref; }
								}
							/>
						</View>
						<ScrollView
							ref={
								(ref) => {
									this.scrollRef = ref;
								}
							}
							showsVerticalScrollIndicator={false}
							scrollEnabled={this.state.allowScroll}
						>
							<SearchMap
								location={this.props.location}
								selectedResult={this.state.selectedResult}
								style={styles.map_container}
								hideMarker={this.state.sliding}
								shuttle={this.props.shuttle_stops}
								vehicles={this.state.vehicles}
							/>
							<View
								style={styles.bottomContainer}
							>
								<View
									style={styles.spacer}
								/>
								<SearchResults
									results={this.state.searchResults}
									onSelect={(index) => this.updateSelectedResult(index)}
								/>
								<View
									style={styles.spacer}
								/>
								<SearchHistoryCard
									pressHistory={this.pressHistory}
									data={this.props.search_history}
								/>
								<View
									style={styles.spacer}
								/>
							</View>
						</ScrollView>
						{(this.state.showBar) ? (
							<ElevatedView
								style={styles.bottomBarContainer}
								elevation={5}
							>
								<TouchableOpacity
									onPress={
										this.gotoResults
									}
								>
									<Text
										style={styles.bottomBarText}
									>
										See More Results
									</Text>
								</TouchableOpacity>
							</ElevatedView>
							) : (null)
						}
					</View>
					<ShuttleLocationContainer />
				</SideMenu>
			);
		} else {
			return null;
		}
	}
}

function mapStateToProps(state, props) {
	return {
		location: state.location.position,
		locationPermission: state.location.permission,
		toggles: state.shuttle.toggles,
		shuttle_routes: state.shuttle.routes,
		shuttle_stops: state.shuttle.stops,
		vehicles: state.shuttle.vehicles,
		search_history: state.map.history,
	};
}

module.exports = connect(mapStateToProps)(NearbyMapView);

const styles = StyleSheet.create({
	bottomBarContainer: { zIndex: 1, flex: 1, alignItems: 'center', justifyContent: 'center', position: 'absolute', bottom: Math.round(44 * getPRM()) + 24, width: deviceWidth, height: Math.round(44 * getPRM()), borderWidth: 0, backgroundColor: 'white', },
	bottomBarContent: { flex:1, alignItems:'center', justifyContent:'center' },
	bottomBarText: { textAlign: 'center', },

	bottomContainer: { minHeight: deviceHeight },
	map_container : { flex: 1, width: deviceWidth, height: deviceHeight - Math.round(44 * getPRM()), },
	spacer: { height: Math.round(44 * getPRM()) + 12 },
});
