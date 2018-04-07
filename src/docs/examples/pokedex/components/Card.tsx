import { h, Component } from "hyperapp"

export default (props: { number: string; name: string; image: string; classification }) => (
  <div class="card">
    <div class="card-image">
      <figure
        class="image"
        style={{
          padding: "10px"
        }}
      >
        <img
          src={props.image}
          alt={props.name}
          style={{
            maxHeight: "200px",
            width: "unset",
            marginLeft: "auto",
            marginRight: "auto"
          }}
        />
      </figure>
    </div>
    <div class="card-content">
      <p class="title is-4">
        {props.number} - {props.name}
      </p>
      <p class="subtitle is-6">{props.classification}</p>
    </div>
  </div>
)
