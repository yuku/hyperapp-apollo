import { h } from "hyperapp"

import { Link } from "hyperapp-hash-router"

export default (_, children) => (
  <div key="Application">
    <nav class="navbar is-danger">
      <div class="container">
        <div class="navbar-brand">
          <Link to="/" class="navbar-item">
            Pokedex
          </Link>
        </div>
        <div class="navbar-menu">
          <div class="navbar-end">
            <a
              href="https://github.com/yuku-t/hyperapp-apollo"
              class="navbar-item is-hidden-desktop-only"
              target="_blank"
            >
              <span class="icon">
                <i class="fab fa-github fa-lg" />
              </span>
            </a>
          </div>
        </div>
      </div>
    </nav>
    <section class="section">
      <div class="container">{children}</div>
    </section>
  </div>
)
