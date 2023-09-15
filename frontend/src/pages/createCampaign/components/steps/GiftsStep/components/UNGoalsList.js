import React from 'react';
import PropTypes from 'prop-types';
import UNGoals from 'data/UNGoals.json';
import content from 'data/content.json';

const UNGoalsList = ({ goals }) => {
  return (
    <>
      <p className="mb-8">{content.productPreview.story.text}</p>
      <ul className="grid grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-10 md:max-w-[630px]">
        {goals.map((goal) => {
          const {
            node: { key, value },
          } = goal;
          if (value === 'true') {
            const goalData = UNGoals[key];
            if (goalData) {
              return (
                <li className="flex flex-col items-center" key={key}>
                  <div className="w-[55px] h-[50px] md:w-16 md:h-14 mb-6 md:mb-7">
                    <img
                      src={`/resources/images/UNgoals/${goalData.image}`}
                      alt=""
                      className="w-full h-full object-contain object-center"
                    />
                  </div>
                  <p className="mb-0 text-center">{UNGoals[key] && goalData.title}</p>
                </li>
              );
            }
          }
          return null;
        })}
      </ul>
    </>
  );
};

UNGoalsList.propTypes = {
  goals: PropTypes.oneOfType([PropTypes.object, PropTypes.array]).isRequired,
};

export default UNGoalsList;
