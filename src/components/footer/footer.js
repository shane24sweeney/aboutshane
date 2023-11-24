import React, { Component } from "react";

import Image, { imageFromCrystallize } from "@crystallize/react-image";

export default class Footer extends Component {
  render() {
    return (
      <React.Fragment>
        {/* footer
 ================================================== */}
        <footer>
          <div className="row">
            <div className="twelve columns">
              <div className="copyright">© Copyright 2021 Shane Sweeney</div>
            </div>
            <div id="go-top">
              <a className="smoothscroll" title="Back to Top" href="#home">
                <i className="icon-up-open" />
              </a>
            </div>
          </div>
        </footer>{" "}
        {/* Footer End*/}
      </React.Fragment>
    );
  }
}
