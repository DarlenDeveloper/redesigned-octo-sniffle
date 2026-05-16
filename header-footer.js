class SpecialHeader extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
        <nav class="hamburger-navigation">
    <div class="layer"></div>
    <!-- end layer -->
    <div class="container">
      <ul class="nav-menu mobile-menu">   
      </ul>
      <ul class="nav-menu">
        <li><a href="index.html">Home</a></li>
        <li><a href="#listings">Buy</a></li>
        <li><a href="#listings">Rent</a></li>
        <li><a href="#listings">Book</a></li>
        <li><a href="#contact">Contact</a></li>
        <li><a href="#contact">Partner</a></li>
      </ul>
      <!-- end info-box --> 
    </div>
    <!-- end container --> 
  </nav>
  <!-- end hamburger-navigation -->
  <nav class="navbar">
    <div class="container navbar-pill">
      <div class="logo"> 
        <a href="index.html">
          <img src="images/pixon-logo.jpeg" alt="PIXON REAL ESTATE">
        </a> 
      </div>
      
      <div class="site-menu">
        <ul>
          <li><a href="index.html">Home</a></li>
          <li><a href="#listings">Buy</a></li>
          <li><a href="#listings">Rent</a></li>
          <li><a href="#listings">Book</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>
      </div>

      <div class="navbar-button" style="display: flex; align-items: center;">
        <a href="#contact" style="font-weight: 700; font-size: 11px; letter-spacing: 1px; color: #111;">PARTNER</a>
      </div>

      <div class="hamburger-menu">
        <button class="menu">
        <svg width="45" height="45" viewBox="0 0 100 100">
          <path class="line line1" d="M 20,29.000046 H 80.000231 C 80.000231,29.000046 94.498839,28.817352 94.532987,66.711331 94.543142,77.980673 90.966081,81.670246 85.259173,81.668997 79.552261,81.667751 75.000211,74.999942 75.000211,74.999942 L 25.000021,25.000058" />
          <path class="line line2" d="M 20,50 H 80"/>
          <path class="line line3" d="M 20,70.999954 H 80.000231 C 80.000231,70.999954 94.498839,71.182648 94.532987,33.288669 94.543142,22.019327 90.966081,18.329754 85.259173,18.331003 79.552261,18.332249 75.000211,25.000058 75.000211,25.000058 L 25.000021,74.999942" />
        </svg>
        </button>
      </div>
    </div>
  </nav>`;
  }
}

class SpecialFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
        <footer class="footer">
    <div class="container">
      <div class="row">
        <div class="col-lg-4">
          <h6 class="widget-title">PIXON REAL ESTATE</h6>
          <p>Discover unparalleled luxury at PIXON REAL ESTATE in Kampala <u>Uganda</u> Nestled in premium locations, our exclusive listings blend historic charm with modern elegance.</p>
        </div>
        <!-- end col-4 -->
        <div class="col-xl-3 col-lg-1"> </div>
        <!-- end col-3 -->
        <div class="col-xl-3 col-lg-3">
          <h6 class="widget-title">Contact</h6>
          <p>info@pixonrealestate.com<br>
            +256 782 603 730<br>
            <!--     <a href="https://www.google.com/maps/search/?api=1&amp;query=centurylink+field" data-fancybox="" data-width="640" data-height="360">Discover On Map</a></p> -->
            <a href="https://www.google.com/maps/search/?api=1&query=Plot+421+Kulambiro+Kisasi+Ring+Road+Kampala+Uganda" 
            data-fancybox="" 
            data-width="640" 
            data-height="360">
            Discover On Map
          </a>
          
        </div>
        <!-- end col-3 -->
        <div class="col-xl-2 col-lg-4">
          <h6 class="widget-title">Location</h6>
          <p>Kololo, Nakasero, Naguru,<br>
            Bugolobi & more, Kampala <br>
            Uganda </p>
        </div>
        <!-- end col-2 -->
        <div class="col-12">
          <div class="bottom-bar"> <span>© 2026 PIXON REAL ESTATE | Premium Listings</span>
            <!-- end footer-social --> 
          </div>
          <!-- end bottom-bar --> 
        </div>
        <!-- end col-12 --> 
      </div>
      <!-- end row --> 
    </div>
    <!-- end container --> 
  </footer>`;
  }
}


customElements.define('special-header', SpecialHeader);
customElements.define('special-footer', SpecialFooter);