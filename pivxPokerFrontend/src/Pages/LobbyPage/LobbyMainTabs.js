import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

const MainTabs = (props) => {

   return (
      <div className="tabs">
         {props.tabList.map((tabName, i) =>
               <button key={i} className={"btn main-tab "+(props.currentTab===tabName?" main-tab-active":" disabled")} onClick={() => { props?.HandleTabChange(tabName) }}>{tabName} </button>
         )}
      </div>
   );
};

const mapStateToProps = (state) => ({
   currentTab: state.LobbyReducer.currentTab,
   tabList: state.LobbyReducer.tabList
})

const mapDispatchToProps = (dispatch) => {
   return bindActionCreators(
     {
       ...global.Actions.LobbyAction,      
     },
     dispatch,
   );
 };

export default connect(mapStateToProps, mapDispatchToProps)(MainTabs)
